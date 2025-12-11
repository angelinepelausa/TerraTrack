// screens/TaskVerifyScreen.js
import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import { useAuth } from '../context/AuthContext';
import { getUserTerraCoins } from '../repositories/userRepository';
import firestore from '@react-native-firebase/firestore';

const TaskVerifyScreen = ({ navigation }) => {
  const [terraCoins, setTerraCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mySubmittedTasks, setMySubmittedTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTerraCoins();
      loadTasks();
    }
  }, [user]);

  const fetchTerraCoins = async () => {
    try {
      const result = await getUserTerraCoins(user.uid);
      if (result.success) setTerraCoins(result.terraCoins);
    } catch (error) {
      console.error("Error fetching TerraCoins:", error);
    }
  };

  // Function to get TODAY'S date in the correct format
  const getTodaysDate = () => {
    // Use Philippine time (UTC+8) if needed, or use local time
    const now = new Date();
    // For Philippine time: const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    // return phTime.toISOString().split('T')[0];
    return now.toISOString().split('T')[0];
  };

  // NEW: Get ALL submitted tasks from user's verifications collection (not just latest distribution)
  const getMySubmittedTasks = async (userId) => {
    try {
      const userRef = firestore().collection('users').doc(userId);
      const verificationsSnap = await userRef.collection('verifications').get();
      
      const submittedTasks = [];
      
      if (!verificationsSnap.empty) {
        for (const doc of verificationsSnap.docs) {
          const date = doc.id; // Date is the document ID
          const data = doc.data();
          
          if (data && typeof data === 'object') {
            Object.keys(data).forEach(taskId => {
              const taskData = data[taskId];
              if (taskData && taskData.status === 'pending') {
                submittedTasks.push({
                  id: taskId,
                  ...taskData,
                  submittedDate: date,
                  taskId: taskId
                });
              }
            });
          }
        }
      }
      
      console.log(`Found ${submittedTasks.length} submitted tasks for user ${userId}`);
      return submittedTasks;
    } catch (error) {
      console.error("Error fetching submitted tasks:", error);
      return [];
    }
  };

  // NEW: Get ALL assigned verification tasks (not just latest distribution)
  const getMyAssignedTasks = async (userId) => {
    try {
      const userRef = firestore().collection('users').doc(userId);
      const assignedVerificationsSnap = await userRef.collection('assigned_verifications').get();
      
      const assignedTasks = [];
      
      if (!assignedVerificationsSnap.empty) {
        for (const doc of assignedVerificationsSnap.docs) {
          const docId = doc.id; // Format: date_runId
          const data = doc.data();
          
          if (data && typeof data === 'object') {
            Object.keys(data).forEach(compositeKey => {
              const taskData = data[compositeKey];
              if (taskData && taskData.status === 'pending') {
                // Extract ownerId and taskId from composite key (format: ownerId_taskId)
                const [ownerId, taskId] = compositeKey.split('_');
                
                assignedTasks.push({
                  id: compositeKey,
                  ...taskData,
                  docId: docId,
                  ownerId: ownerId,
                  taskId: taskId
                });
              }
            });
          }
        }
      }
      
      console.log(`Found ${assignedTasks.length} assigned tasks for user ${userId}`);
      return assignedTasks;
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
      return [];
    }
  };

  // NEW: Alternative method - check global tasks_verification collection
  const getGlobalSubmittedTasks = async (userId) => {
    try {
      const today = getTodaysDate();
      const globalRef = firestore()
        .collection('tasks_verification')
        .doc(today)
        .collection('submitted');
      
      // Query for tasks submitted by this user with pending status
      const querySnap = await globalRef
        .where('userId', '==', userId)
        .where('status', '==', 'pending')
        .get();
      
      const submittedTasks = [];
      
      if (!querySnap.empty) {
        querySnap.forEach(doc => {
          const taskData = doc.data();
          if (taskData) {
            submittedTasks.push({
              id: doc.id,
              ...taskData,
              submittedDate: today
            });
          }
        });
      }
      
      console.log(`Found ${submittedTasks.length} global submitted tasks for user ${userId} on ${today}`);
      return submittedTasks;
    } catch (error) {
      console.error("Error fetching global submitted tasks:", error);
      return [];
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Try multiple approaches to get tasks
      const [userSubmittedTasks, userAssignedTasks, globalSubmittedTasks] = await Promise.all([
        getMySubmittedTasks(user.uid),
        getMyAssignedTasks(user.uid),
        getGlobalSubmittedTasks(user.uid)
      ]);
      
      // Combine results from different sources
      const allSubmittedTasks = [...userSubmittedTasks, ...globalSubmittedTasks];
      
      // Remove duplicates by id
      const uniqueSubmittedTasks = Array.from(
        new Map(allSubmittedTasks.map(task => [task.id, task])).values()
      );
      
      setMySubmittedTasks(uniqueSubmittedTasks);
      setAssignedTasks(userAssignedTasks);
      
      console.log(`Final counts - Submitted: ${uniqueSubmittedTasks.length}, Assigned: ${userAssignedTasks.length}`);
      
      // DEBUG: Log what we found
      if (uniqueSubmittedTasks.length === 0 && userAssignedTasks.length === 0) {
        console.log("DEBUG: No tasks found. Checking collections...");
        
        // Debug: List available collections
        const userRef = firestore().collection('users').doc(user.uid);
        
        const [verificationsSnap, assignedSnap] = await Promise.all([
          userRef.collection('verifications').get(),
          userRef.collection('assigned_verifications').get()
        ]);
        
        console.log(`User has ${verificationsSnap.size} verification documents`);
        console.log(`User has ${assignedSnap.size} assigned_verification documents`);
        
        verificationsSnap.forEach(doc => {
          console.log(`Verification doc ${doc.id}:`, Object.keys(doc.data() || {}).length, "tasks");
        });
        
        assignedSnap.forEach(doc => {
          console.log(`Assigned doc ${doc.id}:`, Object.keys(doc.data() || {}).length, "tasks");
        });
      }
      
    } catch (error) {
      console.error("Error loading tasks:", error);
      setMySubmittedTasks([]);
      setAssignedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Bar + Back */}
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <View style={styles.coinBox}>
            <Image source={require('../assets/images/TerraCoin.png')} style={styles.coinImage} />
            <Text style={styles.coinText}>{terraCoins}</Text>
          </View>
        </View>

        <View style={styles.backandfilter}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require('../assets/icons/back.png')} style={styles.backIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        style={{ marginTop: vScale(150) }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* My Submitted Tasks */}
        <Text style={styles.taskverText}>Task Verification</Text>
        <View style={styles.tasksContainer}>
          {mySubmittedTasks.length === 0 ? (
            <Text style={styles.emptyText}>No submitted tasks pending verification.</Text>
          ) : (
            mySubmittedTasks.map((task) => (
              <View style={styles.taskCard} key={`${task.submittedDate}_${task.id}`}>
                <Image
                  source={task.photoUrl ? { uri: task.photoUrl } : require('../assets/images/bus.png')}
                  style={styles.taskimg}
                />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDate}>Submitted: {task.submittedDate}</Text>
                </View>
                <View
                  style={[
                    styles.statusContainer,
                    task.status === 'pending' ? { backgroundColor: '#f1c40f' } :
                    task.status === 'approved' ? { backgroundColor: '#27ae60' } :
                    task.status === 'rejected' ? { backgroundColor: '#e74c3c' } :
                    { backgroundColor: '#fff' }
                  ]}
                >
                  <Text style={styles.statusText}>{task.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Assigned Tasks */}
        <Text style={styles.vertaskText}>Verify Task</Text>
        <View style={styles.vertaskContainer}>
          {assignedTasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks assigned for verification.</Text>
          ) : (
            assignedTasks.map((task) => (
              <View style={styles.vertaskCard} key={`${task.docId}_${task.id}`}>
                <Image 
                  source={{ uri: task.photoUrl || task.photoUrl }} 
                  style={styles.vertaskimg} 
                  defaultSource={require('../assets/images/bus.png')}
                />
                <View style={{ flex: 1, marginRight: scale(10) }}>
                  <Text style={styles.vertaskTitle}>{task.title}</Text>
                  <Text style={styles.taskDate}>Submitted: {task.submittedDate || 'Unknown'}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.taskVerifyBtn, task.status !== 'pending' && { backgroundColor: '#6A6A6A' }]}
                  disabled={task.status !== 'pending'}
                  onPress={() => navigation.navigate('VerifyTaskScreen', { 
                    task: { 
                      ...task, 
                      submittedDate: task.submittedDate || getTodaysDate()
                    }, 
                    onVerificationComplete: loadTasks 
                  })}
                >
                  <Text style={styles.taskVerifyText}>{task.status !== 'pending' ? 'Reviewed' : 'Verify'}</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  scrollContainer: { paddingBottom: vScale(30) },

  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },

  topBar: {
    height: vScale(90),
    backgroundColor: '#415D43',
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: scale(10),
  },
  backandfilter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    marginTop: vScale(5),
    marginBottom: vScale(5),
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

  taskverText: {
    color: '#FFFFFF',
    fontSize: scale(24),
    marginLeft: scale(15),
    fontWeight: 'bold',
    marginTop: vScale(10),
  },
  emptyText: { color: "#aaa", textAlign: "center", marginVertical: vScale(10) },

  backIcon: { width: 60, height: 60, resizeMode: "contain", tintColor: "#fff" },

  tasksContainer: { padding: scale(15), marginTop: vScale(15), width: '100%' },
  taskCard: {
    backgroundColor: '#CCCCCC',
    borderRadius: scale(15),
    padding: scale(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vScale(15),
  },
  taskimg: { width: 50, height: 50, marginRight: scale(15), borderRadius: 8 },
  taskInfo: { flex: 1, marginRight: scale(10) },
  taskTitle: {
    fontSize: scale(13),
    fontWeight: 'bold',
    color: '#131313',
    marginBottom: scale(4),
  },
  taskDate: {
    fontSize: scale(10),
    color: '#666',
    fontStyle: 'italic',
  },
  statusContainer: {
    paddingHorizontal: scale(8),
    paddingVertical: vScale(3),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: scale(10),
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  vertaskText: {
    color: '#FFFFFF',
    fontSize: scale(24),
    marginLeft: scale(15),
    fontWeight: 'bold',
    marginTop: vScale(15),
  },
  vertaskContainer: { padding: scale(15), marginTop: vScale(15), width: '100%' },
  vertaskCard: {
    backgroundColor: '#CCCCCC',
    borderRadius: scale(15),
    padding: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vScale(15),
    justifyContent: 'space-between',
  },
  vertaskimg: { width: 55, height: 55, marginRight: scale(20), borderRadius: 8 },
  vertaskTitle: {
    fontSize: scale(14),
    fontWeight: 'bold',
    color: '#131313',
    marginBottom: scale(4),
  },
  taskVerifyBtn: {
    backgroundColor: '#415D43',
    borderRadius: scale(15),
    padding: scale(7),
    width: scale(100),
    alignItems: 'center',
  },
  taskVerifyText: { color: '#FFFFFF', fontSize: scale(12), fontWeight: 'bold' },
});

export default TaskVerifyScreen;