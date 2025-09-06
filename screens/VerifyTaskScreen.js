// screens/VerifyTaskScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { scale, vScale } from '../utils/scaling';
import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';

const { height } = Dimensions.get('window');

const VerifyTaskScreen = ({ route, navigation }) => {
  const { task, onVerificationComplete } = route.params;
  const { user } = useAuth();

  const [decision, setDecision] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Helpers ---------------------------------------------------------------
  const today = () => new Date().toISOString().split('T')[0];

  const extractIds = (t) => {
    let ownerUid = t.ownerId || t.userId || null;
    let taskId = t.taskId || null;

    const composite = (t.id || t.docId || '').toString();
    if ((!ownerUid || !taskId) && composite.includes('_')) {
      const idx = composite.indexOf('_');
      const left = composite.slice(0, idx);
      const right = composite.slice(idx + 1);
      ownerUid = ownerUid || left;
      taskId   = taskId   || right;
    }

    if (!ownerUid || !taskId) {
      throw new Error('Missing ownerUid/taskId. Provide ownerId & taskId or an id like "ownerUid_taskId".');
    }
    const compositeKey = `${ownerUid}_${taskId}`;
    return { ownerUid, taskId, compositeKey };
  };

  const updateOwnerVerification = async ({ ownerUid, taskId }, status, notes, verifierUid) => {
    const ref = firestore()
      .collection('users').doc(ownerUid)
      .collection('verifications').doc(today());

    const updatePayload = {
      [`${taskId}.status`]: status,
      [`${taskId}.verifiedBy`]: verifierUid,
    };
    if (status === 'rejected') {
      updatePayload[`${taskId}.detailsForRejection`] = notes;
    }

    await ref.update(updatePayload);
  };

  const updateGlobalSubmitted = async (compositeKey, status, notes, verifierUid) => {
    const ref = firestore()
      .collection('tasks_verification').doc(today())
      .collection('submitted').doc(compositeKey);

    const updatePayload = {
      status,
      verifiedBy: verifierUid,
    };
    if (status === 'rejected') {
      updatePayload.detailsForRejection = notes;
    }
    await ref.update(updatePayload);
  };

  const updateVerifierAssigned = async (verifierUid, compositeKey, status) => {
    const coll = firestore()
      .collection('users').doc(verifierUid)
      .collection('assigned_verifications');

    const snap = await coll.get();
    if (snap.empty) return;

    const todaysDocs = snap.docs.filter(d => d.id.startsWith(`${today()}_`));
    for (const d of todaysDocs) {
      const data = d.data() || {};
      if (Object.prototype.hasOwnProperty.call(data, compositeKey)) {
        const ref = coll.doc(d.id);
        await ref.update({
          [`${compositeKey}.status`]: status,
        });
        return;
      }
    }
  };

  // --- NEW: update all other assigned verifiers too --------------------------
  const updateAllAssignedVerifiers = async (compositeKey, status, notes, verifierUid) => {
    const todayStr = today();

    const usersSnap = await firestore().collection('users').get();
    const userIds = usersSnap.docs.map(d => d.id);

    for (const uid of userIds) {
      const coll = firestore()
        .collection('users').doc(uid)
        .collection('assigned_verifications');

      const snap = await coll.get();
      if (snap.empty) continue;

      const todaysDocs = snap.docs.filter(d => d.id.startsWith(`${todayStr}_`));
      for (const d of todaysDocs) {
        const data = d.data() || {};
        if (Object.prototype.hasOwnProperty.call(data, compositeKey)) {
          const ref = coll.doc(d.id);
          const updatePayload = {
            [`${compositeKey}.status`]: status,
            [`${compositeKey}.verifiedBy`]: verifierUid,
          };
          if (status === 'rejected') {
            updatePayload[`${compositeKey}.detailsForRejection`] = notes;
          }
          await ref.update(updatePayload);
        }
      }
    }
  };

  // --- Main submit -----------------------------------------------------------
  const handleSubmit = async () => {
    if (!user) return;

    if (!decision) {
      Alert.alert('Validation', 'Please choose Approve or Reject.');
      return;
    }
    if (decision === 'rejected' && !rejectionNotes.trim()) {
      Alert.alert('Validation', 'Please provide details for rejection.');
      return;
    }

    setLoading(true);
    try {
      const { ownerUid, taskId, compositeKey } = extractIds(task);
      const status = decision;

      await updateOwnerVerification({ ownerUid, taskId }, status, rejectionNotes.trim(), user.uid);
      await updateGlobalSubmitted(compositeKey, status, rejectionNotes.trim(), user.uid);
      await updateVerifierAssigned(user.uid, compositeKey, status);
      await updateAllAssignedVerifiers(compositeKey, status, rejectionNotes.trim(), user.uid);

      Alert.alert(
        'Success',
        `Task ${status === 'approved' ? 'Approved' : 'Rejected'}!`,
        [{ text: 'OK', onPress: () => { onVerificationComplete?.(); navigation.goBack(); } }]
      );
    } catch (err) {
      console.error('Verification update error:', err);
      Alert.alert('Error', err.message || 'Failed to update verification.');
    } finally {
      setLoading(false);
    }
  };

  const imageHeight = decision === 'rejected' ? height * 0.35 : height * 0.45;

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Verify Task</Text></View>

      <View style={styles.content}>
        <Image source={{ uri: task.photoUrl }} style={[styles.taskImage, { height: imageHeight }]} resizeMode="contain" />
        <Text style={styles.taskTitle}>{task.title}</Text>

        <Text style={styles.sectionTitle}>Verification Decision</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.optionBtn, decision === 'approved' && styles.approve]}
            onPress={() => setDecision('approved')}
            disabled={loading}
          >
            <Text style={styles.optionText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionBtn, decision === 'rejected' && styles.reject]}
            onPress={() => setDecision('rejected')}
            disabled={loading}
          >
            <Text style={styles.optionText}>Reject</Text>
          </TouchableOpacity>
        </View>

        {decision === 'rejected' && (
          <TextInput
            style={styles.notes}
            placeholder="Provide details for rejection..."
            placeholderTextColor="#AAAAAA"
            value={rejectionNotes}
            onChangeText={setRejectionNotes}
            multiline
            numberOfLines={3}
          />
        )}

        <TouchableOpacity
          style={[
            styles.submit,
            (!decision || (decision === 'rejected' && !rejectionNotes.trim())) && styles.submitDisabled
          ]}
          onPress={handleSubmit}
          disabled={!decision || (decision === 'rejected' && !rejectionNotes.trim()) || loading}
        >
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.submitText}>Submit Verification</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Styles ------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  header: {
    width: '100%',
    paddingVertical: vScale(25),
    backgroundColor: '#415D43',
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#FFFFFF', fontSize: scale(22), fontWeight: 'bold' },
  content: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: scale(20) },
  taskImage: { width: '100%', borderRadius: scale(10), marginBottom: vScale(15) },
  taskTitle: { color: '#FFFFFF', fontSize: scale(20), fontWeight: 'bold', textAlign: 'center', marginBottom: vScale(20) },
  sectionTitle: { color: '#CCCCCC', fontSize: scale(14), fontWeight: '600', alignSelf: 'flex-start', marginBottom: vScale(10) },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: vScale(20) },
  optionBtn: { flex: 1, paddingVertical: vScale(12), marginHorizontal: scale(5), borderRadius: scale(10), backgroundColor: '#2A2A2A', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  approve: { backgroundColor: '#1F7A3A', borderColor: '#1F7A3A' },
  reject: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
  optionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: scale(14) },
  notes: { width: '100%', backgroundColor: '#2A2A2A', borderRadius: scale(10), padding: scale(12), color: '#FFFFFF', textAlignVertical: 'top', fontSize: scale(14), marginBottom: vScale(15) },
  submit: { width: '100%', backgroundColor: '#415D43', paddingVertical: vScale(14), borderRadius: scale(12), alignItems: 'center' },
  submitDisabled: { backgroundColor: '#444444' },
  submitText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: scale(16) },
});

export default VerifyTaskScreen;
