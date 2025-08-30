// screens/VerifyTaskScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import { useAuth } from '../context/AuthContext';
import taskVerificationService from '../services/taskVerificationService';
import firestore from '@react-native-firebase/firestore';

const VerifyTaskScreen = ({ route, navigation }) => {
  const { ownerUid, taskId, photoUrl, date } = route.params;
  const { user } = useAuth();
  const [taskTitle, setTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTaskTitle();
  }, []);

  const fetchTaskTitle = async () => {
    try {
      // tasks are stored at tasks/{taskId}
      const tdoc = await firestore().collection('tasks').doc(taskId).get();
      if (tdoc.exists) setTaskTitle(tdoc.data().title || taskId);
      else setTaskTitle(taskId);
    } catch (e) {
      console.error(e);
      setTaskTitle(taskId);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (result) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await taskVerificationService.submitVerificationResult({
        verifierUid: user.uid,
        ownerUid,
        taskId,
        date,
        result,
        notes: '',
      });
      Alert.alert('Verification recorded', `You marked this photo as ${result}.`);
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Unable to submit verification. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, marginLeft: 16 }}>
        <Text style={{ color: '#ccc' }}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{taskTitle}</Text>
        <Image source={{ uri: photoUrl }} style={styles.image} />
        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#4CAF50' }]} disabled={submitting} onPress={() => submit('approved')}>
            <Text style={styles.btnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#F44336' }]} disabled={submitting} onPress={() => submit('rejected')}>
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  content: { flex: 1, alignItems: 'center', padding: 16 },
  title: { color: '#FFFFFF', fontSize: scale(18), marginVertical: 12, fontWeight: '700' },
  image: { width: '92%', height: 350, borderRadius: 10, resizeMode: 'cover', marginVertical: 12 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginTop: 24 },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default VerifyTaskScreen;
