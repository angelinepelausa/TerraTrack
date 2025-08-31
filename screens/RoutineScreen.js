import React, { useEffect, useState, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dgdzmrhc4/image/upload';
const UPLOAD_PRESET = 'terratrack';

// ✅ local distribution (was in Firebase function before)
const distributeTasksForVerification = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // get all submitted tasks for today
    const tasksSnap = await firestore()
      .collection("tasks_verification")
      .doc(today)
      .get();

    if (!tasksSnap.exists) return;
    const allTasks = tasksSnap.data() || {};
    const tasksArray = Object.entries(allTasks).map(([taskId, task]) => ({
      taskId,
      ...task,
    }));

    if (tasksArray.length === 0) return;

    // get all users
    const usersSnap = await firestore().collection("users").get();
    const allUsers = usersSnap.docs.map((d) => ({ id: d.id }));

    // filter only users who submitted tasks
    const submitters = [...new Set(tasksArray.map(t => t.userId))];
    const eligibleUsers = allUsers.filter(u => submitters.includes(u.id));

    if (eligibleUsers.length === 0) return;

    console.log("Eligible verifiers:", eligibleUsers.map(u => u.id));

    // round-robin assign each task to 3 verifiers
    let userIndex = 0;
    for (const task of tasksArray) {
      let assignedUsers = [];

      for (let i = 0; i < 3; i++) {
        let verifier = eligibleUsers[userIndex % eligibleUsers.length];

        // skip task owner & duplicates
        while (
          verifier.id === task.userId ||
          assignedUsers.includes(verifier.id)
        ) {
          userIndex++;
          verifier = eligibleUsers[userIndex % eligibleUsers.length];
        }

        assignedUsers.push(verifier.id);

        await firestore()
          .collection("users")
          .doc(verifier.id)
          .collection("assigned_verifications")
          .doc(today)
          .set(
            {
              [task.taskId]: {
                title: task.title || "Untitled Task",
                photoUrl: task.photoUrl || null,
                ownerId: task.userId,
                status: "pending",
              },
            },
            { merge: true }
          );

        userIndex++;
      }
    }

    console.log("✅ Task distribution completed for", today);
  } catch (err) {
    console.error("Error distributing verification tasks:", err);
  }
};

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

// 📌 Save submitted task into shared daily doc
const storeTaskForVerification = async (taskId, taskTitle, photoUrl, userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const verificationRef = firestore()
      .collection('tasks_verification')
      .doc(today);

    await verificationRef.set(
      {
        [taskId]: {
          title: taskTitle,
          status: 'pending',
          submittedAt: firestore.FieldValue.serverTimestamp(),
          photoUrl,
          verifiedBy: '',
          userId: userId,
          date: today,
        },
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error storing task for verification:', error);
  }
};

const RoutineScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [easyTasks, setEasyTasks] = useState([]);
  const [hardTasks, setHardTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('easy');
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [terraCoins, setTerraCoins] = useState(0);
  const [verificationTasks, setVerificationTasks] = useState([]);
  const dateRef = useRef(new Date().toISOString().split('T')[0]);

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

      const remainingEasy = easy.filter((task) => !finishedTasks.includes(task.id));
      const remainingHard = hard.filter((task) => !finishedTasks.includes(task.id));

      setEasyTasks(remainingEasy);
      setHardTasks(remainingHard);

      // Persist same random 3 easy tasks daily
      const verificationsRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('verifications')
        .doc(today);

      const verificationsSnap = await verificationsRef.get();

      let randomEasy = [];
      if (verificationsSnap.exists && verificationsSnap.data()?.dailyEasyTasks) {
        const storedIds = verificationsSnap.data().dailyEasyTasks;
        randomEasy = remainingEasy.filter((t) => storedIds.includes(t.id));
      } else {
        const shuffled = [...remainingEasy].sort(() => 0.5 - Math.random());
        randomEasy = shuffled.slice(0, 3);
        await verificationsRef.set(
          { dailyEasyTasks: randomEasy.map((t) => t.id) },
          { merge: true }
        );
      }

      const verificationIds = [
        ...randomEasy.map((t) => t.id),
        ...remainingHard.map((t) => t.id),
      ];
      setVerificationTasks(verificationIds);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, [user]);

  // 🔥 Run daily refresh + local distribution
  useEffect(() => {
    const interval = setInterval(async () => {
      const today = new Date().toISOString().split('T')[0];
      if (dateRef.current !== today) {
        dateRef.current = today;
        await fetchAllTasks();
        await distributeTasksForVerification(); // 🔑 added
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

    const requiresPhoto = selectedTasks.some((t) => verificationTasks.includes(t.id));
    if (requiresPhoto) {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required to verify tasks.');
        return;
      }
    }

    try {
      const photoUris = {};

      for (const task of selectedTasks) {
        if (verificationTasks.includes(task.id)) {
          const uri = await new Promise((resolve) => {
            launchCamera({ mediaType: 'photo', saveToPhotos: true }, (response) => {
              if (response.didCancel || response.errorCode) resolve(null);
              else resolve(response.assets?.[0]?.uri || null);
            });
          });
          if (uri) photoUris[task.id] = uri;
        }
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

      for (const task of selectedTasks) {
        let photoUrl = null;

        if (verificationTasks.includes(task.id) && photoUris[task.id]) {
          photoUrl = await uploadImageToCloudinary(photoUris[task.id]);
          console.log('Uploaded to Cloudinary:', photoUrl);

          batch.set(
            verificationsRef,
            {
              [task.id]: {
                photoUrl,
                status: 'pending',
                verifiedBy: '',
                submittedAt: firestore.FieldValue.serverTimestamp(),
                title: task.title,
              },
            },
            { merge: true }
          );

          await storeTaskForVerification(task.id, task.title, photoUrl, user.uid);
        }

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
      }

      await batch.commit();

      await addUserRewards(user.uid, selectedTasks.length, selectedTasks.length * 10);
      setTerraCoins((prev) => prev + selectedTasks.length);

      const now = new Date();
      const quarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
      const year = now.getFullYear();
      const docId = `${year}-${quarter}`;

      const communityRef = firestore().collection('community_progress').doc(docId);

      await communityRef.set(
        {
          contributors: {
            [user.uid]: firestore.FieldValue.increment(selectedTasks.length),
          },
          current: firestore.FieldValue.increment(selectedTasks.length),
        },
        { merge: true }
      );

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

        <TouchableOpacity
          style={styles.taskVerifyBtn}
          onPress={() => navigation.navigate('TaskVerifyScreen')}
        >
          <Text style={styles.taskVerifyText}>Task Verification</Text>
        </TouchableOpacity>

        {/* 🔧 Manual trigger button for testing */}
        <TouchableOpacity
          style={[styles.taskVerifyBtn, { backgroundColor: '#709775' }]}
          onPress={distributeTasksForVerification}
        >
          <Text style={[styles.taskVerifyText, { color: '#fff' }]}>Distribute Now (Test)</Text>
        </TouchableOpacity>

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
          style={[
            styles.verifyBtn,
            { backgroundColor: selectedTasks.length > 0 ? '#415D43' : '#6A6A6A' },
          ]}
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
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#CCCCCC',
    alignItems: 'center',
  },
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
  descBox: {
    backgroundColor: '#CCCCCC',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontFamily: 'DMSans-Bold',
    color: '#415D43',
    marginBottom: 12,
    textAlign: 'center',
  },
  detailDesc: {
    fontSize: 14,
    color: '#131313',
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
  },
  taskVerifyBtn: {
    backgroundColor: '#CCCCCC',
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 16,
    alignItems: 'center',
    width: '98%',
    alignSelf: 'center',
  },
  taskVerifyText: { color: '#131313', fontWeight: 'bold', fontSize: 16 },
});

export default RoutineScreen;
