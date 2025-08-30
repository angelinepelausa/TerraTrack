// services/taskVerificationService.js
import firestore from '@react-native-firebase/firestore';

/**
 * ASSUMPTIONS:
 * - Each user who submitted photos for today has a doc at:
 *   users/{ownerUid}/verifications/{date}/{taskId} => { photoUrl, status, taskId, submittedAt }
 * - We persist assignments under:
 *   users/{recipientUid}/assigned_verifications/{date} => { assigned: [ { ownerUid, taskId, photoUrl, status } ] }
 *
 * NOTE:
 * - For production at scale you should move assignment logic to a Cloud Function to avoid races and read-costs.
 */

const MAX_PER_USER = 3;

const getTodayId = () => new Date().toISOString().split('T')[0];

const taskVerificationService = {
  /**
   * Ensure assignments exist for the current user (creates them if not).
   * Will scan all users' verifications/{date} and distribute photos (not assigning user's own photos).
   * Returns the user's assigned array.
   */
  ensureAssignmentsForUser: async (currentUid, date = null) => {
    const today = date || getTodayId();
    const assignedDocRef = firestore()
      .collection('users')
      .doc(currentUid)
      .collection('assigned_verifications')
      .doc(today);

    const assignedSnap = await assignedDocRef.get();
    if (assignedSnap.exists && assignedSnap.data()?.assigned) {
      return assignedSnap.data().assigned;
    }

    // Otherwise create assignments (one-time creation). We'll try to create assignments for all recipients
    // by scanning all users' verifications for today. This is done client-side in a single attempt.
    return await taskVerificationService._createAssignments(today, currentUid);
  },

  /**
   * Creates assignments for all recipients (users who have verifications today).
   * Implementation:
   *  - read all users' verifications/{date} subcollections (only docs with photoUrl and status 'pending')
   *  - build a pool of submissions { ownerUid, taskId, photoUrl }
   *  - build recipient list = users who have verifications doc for today (owners)
   *  - round-robin assign up to MAX_PER_USER to each recipient, skipping submissions from the same owner
   *  - write assigned arrays under users/{recipientUid}/assigned_verifications/{date}
   */
  _createAssignments: async (date, triggerUid) => {
    // 1) fetch all users who have verifications doc for today
    const usersCollection = firestore().collection('users');
    // We'll look for all users that have a verifications/{date} doc by trying to query collectionGroup
    const submissionsSnap = await firestore()
      .collectionGroup('verifications')
      .where('dateMarker', '==', date) // We'll rely on a dateMarker field for easier querying (if you don't have it below we'll fallback)
      .get()
      .catch(() => null);

    // If the collectionGroup approach with dateMarker isn't available in your DB,
    // fallback: scan docs under users/*/verifications/{date} by listing known users. If you don't have a list of users,
    // see the alternative at the bottom of this file.
    let submissions = [];
    if (submissionsSnap && !submissionsSnap.empty) {
      // Each doc is the per-user verifications doc (map of taskid -> { photoUrl, status, ... })
      // But collectionGroup returns the nested doc; we need to read nested map values.
      for (const doc of submissionsSnap.docs) {
        const docRef = doc.ref;
        const ownerUid = docRef.path.split('/')[1]; // users/{ownerUid}/verifications/{date}
        const data = doc.data() || {};
        // iterate keys of data (task ids)
        Object.keys(data).forEach((taskId) => {
          const item = data[taskId];
          if (item?.photoUrl && item?.status === 'pending') {
            submissions.push({
              ownerUid,
              taskId,
              photoUrl: item.photoUrl,
            });
          }
        });
      }
    } else {
      // If no dateMarker or collectionGroup path, fallback approach: attempt to list users who submitted
      // We'll query users collection for a field like hasVerificationToday=true. If you do not have this either,
      // you'll need a Cloud Function to create assignments.
      const fallbackUsersSnap = await usersCollection.where('hasVerificationToday', '==', true).get().catch(() => null);
      if (!fallbackUsersSnap || fallbackUsersSnap.empty) {
        // No submissions found — nothing to assign.
        return [];
      }
      for (const udoc of fallbackUsersSnap.docs) {
        const ownerUid = udoc.id;
        const verDoc = await usersCollection.doc(ownerUid).collection('verifications').doc(date).get();
        if (!verDoc.exists) continue;
        const data = verDoc.data() || {};
        Object.keys(data).forEach((taskId) => {
          const item = data[taskId];
          if (item?.photoUrl && item?.status === 'pending') {
            submissions.push({
              ownerUid,
              taskId,
              photoUrl: item.photoUrl,
            });
          }
        });
      }
    }

    if (submissions.length === 0) {
      // nothing to assign
      // create empty assigned doc for current user so UI doesn't retry
      await usersCollection.doc(triggerUid).collection('assigned_verifications').doc(date).set({ assigned: [] }, { merge: true });
      return [];
    }

    // Build recipient list = owners (all users with verifications today)
    const recipientSet = new Set(submissions.map((s) => s.ownerUid));
    const recipients = Array.from(recipientSet);

    // Shuffle submissions to randomize distribution
    const shuffled = submissions.sort(() => 0.5 - Math.random());

    // Prepare assignments
    const assignmentsMap = {};
    recipients.forEach((r) => (assignmentsMap[r] = []));

    // round-robin: iterate submissions and try to assign to recipients who are not the owner and not full
    let idx = 0;
    for (const sub of shuffled) {
      // try to find a recipient to take this photo
      let attempts = 0;
      let assigned = false;
      while (attempts < recipients.length) {
        const recipient = recipients[idx % recipients.length];
        idx++;
        attempts++;
        if (recipient === sub.ownerUid) continue; // never assign user's own photo to them
        if (assignmentsMap[recipient].length >= MAX_PER_USER) continue;
        // assign
        assignmentsMap[recipient].push({
          ownerUid: sub.ownerUid,
          taskId: sub.taskId,
          photoUrl: sub.photoUrl,
          status: 'unseen',
          assignedAt: firestore.FieldValue.serverTimestamp(),
        });
        assigned = true;
        break;
      }
      if (!assigned) {
        // all recipients either full or only owner left; skip this submission
        continue;
      }
    }

    // Now write assignments to each user's assigned_verifications/{date}
    const batch = firestore().batch();
    const usersRef = firestore().collection('users');
    for (const recipient of recipients) {
      const docRef = usersRef.doc(recipient).collection('assigned_verifications').doc(date);
      batch.set(docRef, { assigned: assignmentsMap[recipient] || [] }, { merge: true });
    }

    // Commit
    await batch.commit();

    // return the assignment for triggerUid (may be empty)
    return assignmentsMap[triggerUid] || [];
  },

  /**
   * Fetch assigned items for a user (explicit).
   */
  fetchAssignedForUser: async (currentUid, date = null) => {
    const today = date || getTodayId();
    const docRef = firestore()
      .collection('users')
      .doc(currentUid)
      .collection('assigned_verifications')
      .doc(today);
    const snap = await docRef.get();
    return snap.exists ? snap.data().assigned || [] : [];
  },

  /**
   * Submit verifier result (approve/reject).
   * - update owner's verifications/{date}/{taskId}.status = 'approved'|'rejected'
   * - set verifiedBy: verifierUid and verifiedAt
   * - update the assigned item status in recipient's assigned_verifications/{date}
   */
  submitVerificationResult: async ({
    verifierUid,
    ownerUid,
    taskId,
    date = null,
    result, // 'approved' or 'rejected'
    notes = '',
  }) => {
    const today = date || getTodayId();
    const ownerVerDocRef = firestore().collection('users').doc(ownerUid).collection('verifications').doc(today);
    const recipientAssignedRef = firestore().collection('users').doc(verifierUid).collection('assigned_verifications').doc(today);

    // The owner's verifications doc contains a map keyed by taskId
    // We'll update the nested field ownerVerDocRef.{taskId}.status etc.
    const batch = firestore().batch();

    // update owner's nested map
    batch.set(
      ownerVerDocRef,
      {
        [taskId]: {
          status: result,
          verifiedBy: verifierUid,
          verifiedAt: firestore.FieldValue.serverTimestamp(),
          notes: notes || '',
        },
      },
      { merge: true }
    );

    // update assigned item status for verifier's assigned doc - read it first
    const assignedSnap = await recipientAssignedRef.get();
    if (assignedSnap.exists) {
      const assignedArr = assignedSnap.data().assigned || [];
      const updated = assignedArr.map((a) => {
        if (a.ownerUid === ownerUid && a.taskId === taskId && a.status === 'unseen') {
          return { ...a, status: result, verifiedBy: verifierUid, verifiedAt: firestore.FieldValue.serverTimestamp() };
        }
        return a;
      });
      batch.set(recipientAssignedRef, { assigned: updated }, { merge: true });
    }

    await batch.commit();
    return { success: true };
  },
};

export default taskVerificationService;
