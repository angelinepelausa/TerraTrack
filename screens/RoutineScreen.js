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
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { tasksRepository } from '../repositories/tasksRepository';
import Button from '../components/Button';
import TaskCard from '../components/taskCard';
import HeaderRow from '../components/HeaderRow';
import { scale, vScale } from '../utils/scaling';
import { getUserTerraCoins, addUserRewards } from '../repositories/userRepository';
import firestore from '@react-native-firebase/firestore';
import { launchCamera } from 'react-native-image-picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import ConfirmationPopup from '../components/ConfirmationPopup';

const { width } = Dimensions.get('window');

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dgdzmrhc4/image/upload';
const UPLOAD_PRESET = 'terratrack';

// 🔥 Increment total task finished counter for a user
const incrementTaskFinished = async (uid, count = 1) => {
  try {
    const totalRef = firestore()
      .collection("users")
      .doc(uid)
      .collection("total")
      .doc("stats");

    await totalRef.set(
      { taskFinished: firestore.FieldValue.increment(count) },
      { merge: true }
    );

    console.log(`✅ Incremented ${count} task(s) for user: ${uid}`);
  } catch (error) {
    console.error("❌ Error incrementing taskFinished:", error);
  }
};

// ✅ FIXED distribution logic - only check recent dates
export const distributeTasksForVerification = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const runId = Date.now().toString();

    console.log("🔍 Starting distribution - looking for pending tasks...");

    // Get only RECENT dates (last 7 days) to avoid checking old empty collections
    const recentDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      recentDates.push(date.toISOString().split("T")[0]);
    }

    console.log("📅 Checking recent dates:", recentDates);

    const tasksVerificationColl = firestore().collection("tasks_verification");
    let allPendingTasks = [];

    // Check only recent days for pending tasks
    for (const date of recentDates) {
      try {
        const submittedColl = tasksVerificationColl.doc(date).collection("submitted");
        const submittedSnap = await submittedColl.get();
        
        console.log(`📅 Checking day ${date}: ${submittedSnap.size} tasks`);
        
        const dayPendingTasks = submittedSnap.docs
          .map((doc) => {
            const data = doc.data();
            console.log(`📋 Checking task ${doc.id}:`, { 
              status: data.status, 
              userId: data.userId,
              taskId: data.taskId 
            });
            
            // Only include tasks that are still pending
            if (data.status === "pending") {
              return {
                docId: doc.id,
                taskId: data.taskId || doc.id,
                userId: data.userId,
                title: data.title || "Untitled Task",
                photoUrl: data.photoUrl || null,
                submittedDate: date,
              };
            }
            return null;
          })
          .filter(task => task !== null);

        allPendingTasks = [...allPendingTasks, ...dayPendingTasks];
      } catch (error) {
        console.log(`⚠️ No data for date ${date} or collection doesn't exist`);
      }
    }

    console.log(`📊 Found ${allPendingTasks.length} pending tasks total`);

    if (allPendingTasks.length === 0) {
      console.log("⚡ No pending tasks for verification");
      return;
    }

    const submitterIds = [...new Set(allPendingTasks.map((t) => t.userId))];
    if (submitterIds.length === 0) {
      console.log("⚡ No eligible submitters");
      return;
    }

    const eligibleUsers = submitterIds.map((id) => ({ id }));

    console.log("Eligible verifiers:", eligibleUsers.map((u) => u.id));
    console.log("Total pending tasks:", allPendingTasks.length);

    const loadMap = Object.fromEntries(eligibleUsers.map((u) => [u.id, 0]));
    let batch = firestore().batch();
    let opCount = 0;

    // First, clear existing assigned verifications for today to avoid duplicates
    const usersSnap = await firestore().collection("users").get();
    
    let clearBatch = firestore().batch();
    let clearCount = 0;

    for (const userDoc of usersSnap.docs) {
      const assignedRef = firestore()
        .collection("users")
        .doc(userDoc.id)
        .collection("assigned_verifications")
        .doc(`${today}_${runId}`);
      
      // Clear any existing document for today's run
      clearBatch.set(assignedRef, {});
      clearCount++;
      
      if (clearCount >= 450) {
        await clearBatch.commit();
        clearBatch = firestore().batch();
        clearCount = 0;
      }
    }
    if (clearCount > 0) await clearBatch.commit();

    // Distribute tasks to verifiers
    for (const task of allPendingTasks) {
      const assignedUsers = [];

      for (let i = 0; i < 3; i++) {
        const candidates = eligibleUsers
          .filter((u) => u.id !== task.userId && !assignedUsers.includes(u.id))
          .sort((a, b) => loadMap[a.id] - loadMap[b.id]);

        if (candidates.length === 0) break;

        const minLoad = loadMap[candidates[0].id];
        const lowest = candidates.filter((c) => loadMap[c.id] === minLoad);

        const verifier = lowest[Math.floor(Math.random() * lowest.length)];

        assignedUsers.push(verifier.id);
        loadMap[verifier.id]++;

        const ref = firestore()
          .collection("users")
          .doc(verifier.id)
          .collection("assigned_verifications")
          .doc(`${today}_${runId}`);

        batch.set(
          ref,
          {
            [`${task.userId}_${task.taskId}`]: {
              taskId: task.taskId,
              title: task.title,
              photoUrl: task.photoUrl,
              ownerId: task.userId,
              status: "pending",
              submittedDate: task.submittedDate,
              distributedAt: firestore.FieldValue.serverTimestamp(),
            },
          },
          { merge: true }
        );

        opCount++;
        if (opCount >= 450) {
          await batch.commit();
          batch = firestore().batch();
          opCount = 0;
        }
      }
    }

    if (opCount > 0) await batch.commit();

    await firestore().collection("distribution").add({
      date: today,
      runId,
      status: "done",
      pendingTasksDistributed: allPendingTasks.length,
      completedAt: firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Distribution finished for", today, "run:", runId);
    console.log("Distributed tasks:", allPendingTasks.length);
    console.log("Final load per user:", loadMap);
  } catch (err) {
    console.error("❌ Distribution error:", err);
  }
};

// ✅ NEW: Function to clean up old completed verifications (optional)
export const cleanupOldVerifications = async (daysToKeep = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    const tasksVerificationColl = firestore().collection("tasks_verification");
    const allDaysSnap = await tasksVerificationColl.get();

    for (const dayDoc of allDaysSnap.docs) {
      // Delete documents older than daysToKeep
      if (dayDoc.id < cutoffDateStr) {
        // Delete all submitted tasks for that day
        const submittedColl = tasksVerificationColl.doc(dayDoc.id).collection("submitted");
        const submittedSnap = await submittedColl.get();
        
        const batch = firestore().batch();
        submittedSnap.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log(`🧹 Cleaned up old verification data for: ${dayDoc.id}`);
      }
    }
  } catch (error) {
    console.error("❌ Error cleaning up old verifications:", error);
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

const storeTaskForVerification = async (taskId, taskTitle, photoUrl, userId) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const globalRef = firestore()
      .collection("tasks_verification")
      .doc(today)
      .collection("submitted")
      .doc(`${userId}_${taskId}`);

    await globalRef.set({
      taskId,
      title: taskTitle,
      status: "pending",
      submittedAt: firestore.FieldValue.serverTimestamp(),
      photoUrl,
      verifiedBy: "",
      userId,
      date: today,
    });

    const userRef = firestore()
      .collection("users")
      .doc(userId)
      .collection("verifications")
      .doc(today);

    await userRef.set(
      {
        [taskId]: {
          title: taskTitle,
          status: "pending",
          photoUrl,
          submittedAt: firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    console.log("✅ Task stored in both global + user verifications:", taskId);
  } catch (error) {
    console.error("❌ Error storing task for verification:", error);
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
  const distributionRunRef = useRef(false);
  
  // NEW STATES FOR CONFIRMATION POPUPS
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('');
  
  // NEW STATE FOR LOADING DURING VERIFICATION
  const [isVerifying, setIsVerifying] = useState(false);

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

useEffect(() => {
  const checkAndRunDistribution = async () => {
    try {
      // Get current time in Philippine time (UTC+8)
      const now = new Date();
      const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      const today = phTime.toISOString().split('T')[0];
      
      // Check if it's 12:30 AM Philippine time
      const hours = phTime.getUTCHours();
      const minutes = phTime.getUTCMinutes();
      
      console.log(`🕛 Current PH Time: ${hours}:${minutes}, Today: ${today}, DateRef: ${dateRef.current}, DistributionRun: ${distributionRunRef.current}`);
      
      // ✅ FIXED: Run at or after 12:30 AM PH time (not just exactly at 12:30)
      if (hours === 0 && minutes >= 30 && dateRef.current !== today && !distributionRunRef.current) {
        distributionRunRef.current = true;
        dateRef.current = today;
        
        console.log("🕛 Running task distribution for PH 12:30 AM…");
        
        try {
          await distributeTasksForVerification();
          // Optional: Clean up old verification data (keep last 7 days)
          await cleanupOldVerifications(7);
          await fetchAllTasks(); // Refresh tasks after distribution
          
          // Reset distribution flag after 2 minutes to prevent multiple runs
          setTimeout(() => {
            distributionRunRef.current = false;
          }, 2 * 60 * 1000);
        } catch (error) {
          console.error("❌ Distribution failed:", error);
          distributionRunRef.current = false; // Reset flag on error
        }
      }
      
      // Reset distribution flag if date changes but we missed the 12:30 window
      if (dateRef.current !== today && distributionRunRef.current) {
        distributionRunRef.current = false;
      }
      
    } catch (error) {
      console.error("❌ Error in distribution check:", error);
    }
  };

  // Check immediately when component mounts
  checkAndRunDistribution();

  // Set up interval to check every minute
  const interval = setInterval(checkAndRunDistribution, 60 * 1000);

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

  const showSuccessMessage = (title, message) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setShowSuccessPopup(true);
  };

  const handleVerifyAction = async () => {
    if (selectedTasks.length === 0) {
      Alert.alert('No Task Selected', 'Please select at least one task to verify.');
      return;
    }

    const requiresPhotoTasks = selectedTasks.filter((t) => verificationTasks.includes(t.id));
    const noPhotoTasks = selectedTasks.filter((t) => !verificationTasks.includes(t.id));

    if (requiresPhotoTasks.length > 0) {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required to verify tasks.');
        return;
      }
    }

    // Show loading indicator when verification starts
    setIsVerifying(true);

    try {
      const photoUris = {};

      // Take photos only for tasks that require verification
      for (const task of requiresPhotoTasks) {
        const uri = await new Promise((resolve) => {
          launchCamera({ mediaType: 'photo', saveToPhotos: true }, (response) => {
            if (response.didCancel || response.errorCode) resolve(null);
            else resolve(response.assets?.[0]?.uri || null);
          });
        });
        if (uri) photoUris[task.id] = uri;
      }

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const quarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
      const year = now.getFullYear();
      const docId = `${year}-${quarter}`;

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

      // Process tasks that require photo verification
      for (const task of requiresPhotoTasks) {
        let photoUrl = null;

        if (photoUris[task.id]) {
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

        // Save activity to community_activity subcollection
        const activityId = `${user.uid}_${task.id}_${Date.now()}`;
        const activityRef = firestore()
          .collection('community_progress')
          .doc(docId)
          .collection('community_activity')
          .doc(activityId);

        batch.set(activityRef, {
          id: activityId,
          userId: user.uid,
          username: user.displayName || 'Anonymous User',
          taskId: task.id,
          taskTitle: task.title,
          timestamp: firestore.FieldValue.serverTimestamp(),
          pointsEarned: 10,
          type: 'task_completed'
        });
      }

      // Process tasks that don't require photo verification
      for (const task of noPhotoTasks) {
        batch.set(
          tasksFinishedRef,
          {
            [task.id]: {
              pointsEarned: 10,
              coinsEarned: 1,
              finishedAt: firestore.FieldValue.serverTimestamp(),
              photoUrl: null,
            },
          },
          { merge: true }
        );

        // Save activity to community_activity subcollection
        const activityId = `${user.uid}_${task.id}_${Date.now()}`;
        const activityRef = firestore()
          .collection('community_progress')
          .doc(docId)
          .collection('community_activity')
          .doc(activityId);

        batch.set(activityRef, {
          id: activityId,
          userId: user.uid,
          username: user.displayName || 'Anonymous User',
          taskId: task.id,
          taskTitle: task.title,
          timestamp: firestore.FieldValue.serverTimestamp(),
          pointsEarned: 10,
          type: 'task_completed'
        });
      }

      // Update community progress
      const communityRef = firestore().collection('community_progress').doc(docId);
      batch.set(
        communityRef,
        {
          contributors: {
            [user.uid]: firestore.FieldValue.increment(selectedTasks.length),
          },
          current: firestore.FieldValue.increment(selectedTasks.length),
        },
        { merge: true }
      );

      await batch.commit();

      await addUserRewards(user.uid, selectedTasks.length, selectedTasks.length * 10);
      setTerraCoins((prev) => prev + selectedTasks.length);

      await incrementTaskFinished(user.uid, selectedTasks.length);

      setEasyTasks((prev) => prev.filter((t) => !selectedTasks.some((s) => s.id === t.id)));
      setHardTasks((prev) => prev.filter((t) => !selectedTasks.some((s) => s.id === t.id)));

      // SHOW APPROPRIATE SUCCESS MESSAGE
      if (requiresPhotoTasks.length > 0 && noPhotoTasks.length > 0) {
        showSuccessMessage(
          'Tasks Submitted!',
          'Tasks submitted for verification. You\'ll receive rewards after approval.'
        );
      } else if (requiresPhotoTasks.length > 0) {
        showSuccessMessage(
          'Submitted for Verification',
          'Task submitted for verification. You\'ll receive rewards after approval.'
        );
      } else {
        showSuccessMessage(
          'Tasks Verified!',
          'Task verified successfully! Rewards have been added to your account.'
        );
      }

      setSelectedTasks([]);
    } catch (error) {
      console.error('Error verifying tasks:', error);
      Alert.alert('Error', 'Something went wrong verifying tasks.');
    } finally {
      // Hide loading indicator when verification is complete
      setIsVerifying(false);
    }
  };

  const tasks = activeTab === 'easy' ? easyTasks : hardTasks;

  if (selectedTask) {
    return (
      <View style={styles.detailContainer}>
        <HeaderRow
          title="Task Details"
          onBackPress={() => setSelectedTask(null)}
        />
       
        <View style={styles.descWrapper}>
          {selectedTask.imageUrl && (
            <Image
              source={{ uri: selectedTask.imageUrl }}
              style={styles.detailImage}
            />
          )}
         
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
      {/* SUCCESS POPUP USING ConfirmationPopup COMPONENT */}
      <ConfirmationPopup
        visible={showSuccessPopup}
        onConfirm={() => setShowSuccessPopup(false)}
        title={popupTitle}
        message={popupMessage}
        confirmText="OK"
        type="success"
      />

      {/* LOADING MODAL FOR VERIFICATION PROCESS */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={isVerifying}
        onRequestClose={() => {}} // Prevent closing by back button
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color="#415D43" />
            <Text style={styles.loadingText}>Verifying Tasks...</Text>
            <Text style={styles.loadingSubtext}>Please wait while we process your tasks</Text>
          </View>
        </View>
      </Modal>

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
          title={isVerifying ? "Verifying..." : "Verify Action"}
          style={[
            styles.verifyBtn,
            { backgroundColor: (selectedTasks.length > 0 && !isVerifying) ? '#415D43' : '#6A6A6A' },
          ]}
          textStyle={styles.verifyText}
          onPress={handleVerifyAction}
          disabled={isVerifying || selectedTasks.length === 0}
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
  detailImage: {
    width: '85%',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
    resizeMode: 'cover',
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
  // New styles for loading modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#415D43',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default RoutineScreen;