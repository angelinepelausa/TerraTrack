import firestore from '@react-native-firebase/firestore';

export const taskVerificationRepository = {
  getUserSubmittedTasks: async (userId, date) => {
    try {
      const snapshot = await firestore()
        .collection("users")
        .doc(userId)
        .collection("verifications")
        .doc(date)
        .get();

      if (!snapshot.exists) return { success: true, tasks: [] };

      const data = snapshot.data() || {};
      const tasks = Object.entries(data)
        .filter(([key]) => key !== "dailyEasyTasks")
        .map(([taskId, task]) => ({
          id: taskId,
          title: task?.title || "Unknown Task",
          status: task?.status || "pending",
          photoUrl: task?.photoUrl || null,
        }));

      return { success: true, tasks };
    } catch (error) {
      console.error("Error fetching user submitted tasks:", error);
      return { success: false, error: error.message, tasks: [] };
    }
  },

  getAssignedVerificationTasks: async (userId, date) => {
    try {
      const snapshot = await firestore()
        .collection("users")
        .doc(userId)
        .collection("assigned_verifications")
        .get();

      let assignedTasks = [];
      snapshot.forEach((doc) => {
        if (doc.id.startsWith(date)) {
          const data = doc.data();
          const tasks = Object.entries(data)
            .filter(([key]) => key !== "assigned")
            .map(([taskId, task]) => ({
              id: taskId,
              title: task?.title || "Untitled Task",
              photoUrl: task?.photoUrl || null,
              status: task?.status || "pending",
              userId: task?.ownerId || "unknown",
            }));
          assignedTasks.push(...tasks);
        }
      });

      return { success: true, tasks: assignedTasks };
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
      return { success: false, error: error.message, tasks: [] };
    }
  },

submitVerificationResult: async (verifierUid, ownerUid, taskId, date, result, notes = '') => {
  try {
    if (!verifierUid || !ownerUid || !taskId || !date || !result) {
      throw new Error("Missing required parameters for verification");
    }

    const safeNotes = notes || '';

    // 1. Update owner's verifications
    const ownerVerificationsRef = firestore()
      .collection("users")
      .doc(ownerUid)
      .collection("verifications")
      .doc(date);

    const ownerVerificationsDoc = await ownerVerificationsRef.get();

    if (!ownerVerificationsDoc.exists) {
      return { success: false, error: "Owner verifications document not found" };
    }

    const ownerData = ownerVerificationsDoc.data();

    // 🔥 owner tasks are keyed directly by taskId
    if (!ownerData[taskId]) {
      console.warn(`❌ Owner doc has no key ${taskId}. Available:`, Object.keys(ownerData));
      return { success: false, error: "Task not found in owner's verifications" };
    }

    await ownerVerificationsRef.set({
      [taskId]: {
        ...ownerData[taskId],
        status: result,
        verifiedBy: verifierUid,
        verifiedAt: firestore.FieldValue.serverTimestamp(),
        notes: safeNotes,
      }
    }, { merge: true });

    console.log("✅ Owner's task updated");

    // 2. Update verifier's assigned_verifications
    const verifierAssignedQuery = await firestore()
      .collection("users")
      .doc(verifierUid)
      .collection("assigned_verifications")
      .where(firestore.FieldPath.documentId(), '>=', date)
      .where(firestore.FieldPath.documentId(), '<=', date + '\uf8ff')
      .get();

    const batch = firestore().batch();
    let foundInVerifierCollection = false;

    verifierAssignedQuery.forEach((doc) => {
      const docData = doc.data();
      Object.entries(docData).forEach(([fieldKey, task]) => {
        if (task.taskId === taskId && task.ownerId === ownerUid) {
          foundInVerifierCollection = true;
          const verifierDocRef = firestore()
            .collection("users")
            .doc(verifierUid)
            .collection("assigned_verifications")
            .doc(doc.id);

          batch.set(verifierDocRef, {
            [fieldKey]: {
              ...task,
              status: result,
              verifiedBy: verifierUid,
              verifiedAt: firestore.FieldValue.serverTimestamp(),
            }
          }, { merge: true });
        }
      });
    });

    if (foundInVerifierCollection) {
      await batch.commit();
      console.log("✅ Verifier's task updated");
    } else {
      console.warn(`❌ Task ${taskId} not found in verifier's assigned_verifications`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error submitting verification result:", error);
    return { success: false, error: error.message };
  }
}
};