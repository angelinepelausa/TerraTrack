import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { tasksRepository } from '../repositories/tasksRepository';
import Button from '../components/Button';
import TaskCard from '../components/taskCard';
import { scale, vScale } from '../utils/scaling';
import { getUserTerraCoins, addUserRewards } from '../repositories/userRepository';
import firestore from '@react-native-firebase/firestore';
import { launchCamera } from 'react-native-image-picker';
import axios from 'axios';

const { width } = Dimensions.get('window');

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dgdzmrhc4/image/upload';
const UPLOAD_PRESET = 'terratrack';

const uploadImageToCloudinary = async (uri) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'task-photo.jpg',
    });
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await axios.post(CLOUDINARY_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

const RoutineScreen = () => {
  const { user } = useAuth();
  const [easyTasks, setEasyTasks] = useState([]);
  const [hardTasks, setHardTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('easy');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [terraCoins, setTerraCoins] = useState(0);

  const fetchAllTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [easy, hard] = await Promise.all([
        tasksRepository.getEasyTasks(),
        tasksRepository.getHardTasks(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const finishedRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('tasks_finished')
        .doc(today);

      const finishedSnapshot = await finishedRef.get();

      let finishedData = {};
      if (!finishedSnapshot.exists) {
        await finishedRef.set({});
        finishedData = {};
      } else {
        finishedData = finishedSnapshot.data() || {};
      }

      const finishedTasks = Object.keys(finishedData);

      setEasyTasks(easy.filter((task) => !finishedTasks.includes(task.id)));
      setHardTasks(hard.filter((task) => !finishedTasks.includes(task.id)));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, [user]);

  useEffect(() => {
    if (user) fetchTerraCoins();
  }, [user]);

  const fetchTerraCoins = async () => {
    try {
      const result = await getUserTerraCoins(user.uid);
      if (result.success) setTerraCoins(result.terraCoins);
    } catch (error) {
      console.error('Error fetching TerraCoins:', error);
    }
  };

  const handleTaskSelect = (task, isSelected) => {
    if (isSelected) setSelectedTasks((prev) => [...prev, task]);
    else setSelectedTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'We need camera access to verify tasks',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const handleVerifyAction = async () => {
    if (selectedTasks.length === 0) {
      Alert.alert('No Task Selected', 'Please select at least one task to verify.');
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to verify tasks.');
      return;
    }

    try {
      const photoUris = [];

      // Capture photos for up to 3 tasks
      for (let i = 0; i < Math.min(3, selectedTasks.length); i++) {
        const uri = await new Promise((resolve) => {
          launchCamera({ mediaType: 'photo', saveToPhotos: true }, (response) => {
            if (response.didCancel || response.errorCode) resolve(null);
            else resolve(response.assets?.[0]?.uri || null);
          });
        });
        photoUris.push(uri);
      }

      const today = new Date().toISOString().split('T')[0];

      const tasksFinishedRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('tasks_finished')
        .doc(today);

      const verificationsRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('verifications')
        .doc(today);

      const batch = firestore().batch();

      for (let i = 0; i < selectedTasks.length; i++) {
        const task = selectedTasks[i];
        const isFirst3 = i < 3;
        let photoUrl = null;

        if (isFirst3 && photoUris[i]) {
          photoUrl = await uploadImageToCloudinary(photoUris[i]);
          console.log('Uploaded to Cloudinary:', photoUrl);
        }

        // Save finished task
        batch.set(
          tasksFinishedRef,
          {
            [task.id]: {
              pointsEarned: 10,
              coinsEarned: 1,
              finishedAt: firestore.FieldValue.serverTimestamp(),
              photoUrl: photoUrl || null,
            },
          },
          { merge: true }
        );

        // Save verification under {date} doc
        batch.set(
          verificationsRef,
          {
            [task.id]: {
              photoUrl: photoUrl || null,
              status: 'pending',
              verifiedBy: '',
              submittedAt: firestore.FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );
      }

      await batch.commit();

      // Update user rewards
      await addUserRewards(user.uid, selectedTasks.length, selectedTasks.length * 10);
      setTerraCoins((prev) => prev + selectedTasks.length);

      // Remove completed tasks from UI
      setEasyTasks((prev) => prev.filter((t) => !selectedTasks.some((s) => s.id === t.id)));
      setHardTasks((prev) => prev.filter((t) => !selectedTasks.some((s) => s.id === t.id)));

      setSelectedTasks([]);
      Alert.alert('Success', 'Tasks verified and rewards added!');
    } catch (error) {
      console.error('Error verifying tasks:', error);
      Alert.alert('Error', 'Something went wrong verifying tasks.');
    }
  };

  const tasks = activeTab === 'easy' ? easyTasks : hardTasks;

  if (selectedTask) {
    return (
      <View style={styles.detailContainer}>
        <TouchableOpacity onPress={() => setSelectedTask(null)} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.descWrapper}>
          <View style={styles.descBox}>
            <Text style={styles.detailTitle}>{selectedTask.title}</Text>
            <Text style={styles.detailDesc}>{selectedTask.description}</Text>
          </View>
        </View>
      </View>
    );
  }

  const renderTask = ({ item }) => (
    <TaskCard task={item} onPress={(task) => setSelectedTask(task)} onAdd={handleTaskSelect} />
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image source={require('../assets/images/TerraCoin.png')} style={styles.coinImage} />
          <Text style={styles.coinText}>{terraCoins}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.header}>Routine</Text>

        <View style={styles.tabContainer}>
          {['easy', 'hard'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No {activeTab} tasks available</Text>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      <View style={styles.verifyWrapper}>
        <Button
          title="Verify Action"
          style={[styles.verifyBtn, { backgroundColor: selectedTasks.length > 0 ? '#415D43' : '#6A6A6A' }]}
          textStyle={styles.verifyText}
          onPress={handleVerifyAction}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    height: vScale(90),
    backgroundColor: '#415D43',
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: scale(10),
    marginBottom: 12,
  },
  coinBox: {
    width: scale(80),
    height: vScale(32),
    backgroundColor: '#DDDDDD',
    borderRadius: scale(30),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinImage: { width: scale(20), height: scale(20), marginRight: scale(5), resizeMode: 'contain' },
  coinText: { color: '#131313', fontWeight: 'bold', fontSize: scale(12) },
  header: { color: '#CCCCCC', fontSize: 20, fontFamily: 'DMSans-Bold', marginBottom: 12 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, marginHorizontal: 5, borderRadius: 20, backgroundColor: '#CCCCCC', alignItems: 'center' },
  activeTab: { backgroundColor: '#415D43' },
  tabText: { color: '#131313', fontWeight: 'bold' },
  activeTabText: { color: '#FFFFFF' },
  list: { paddingBottom: 100 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 20 },
  verifyWrapper: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  verifyBtn: { paddingVertical: 18, borderRadius: 30 },
  verifyText: { color: '#CCCCCC' },
  detailContainer: { flex: 1, backgroundColor: '#131313', padding: 16 },
  backBtn: { marginTop: 20 },
  backText: { color: '#CCCCCC', fontSize: 14 },
  descWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  descBox: { backgroundColor: '#CCCCCC', borderRadius: 10, padding: 20, width: '85%', alignItems: 'center' },
  detailTitle: { fontSize: 18, fontFamily: 'DMSans-Bold', color: '#415D43', marginBottom: 12, textAlign: 'center' },
  detailDesc: { fontSize: 14, color: '#131313', fontFamily: 'DMSans-Regular', textAlign: 'center' },
});

export default RoutineScreen;
