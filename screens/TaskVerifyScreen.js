// screens/TaskVerifyScreen.js
import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import { useAuth } from '../context/AuthContext';
import { getUserTerraCoins } from '../repositories/userRepository';
import firestore from '@react-native-firebase/firestore';

const TaskVerifyScreen = ({ navigation }) => {
  const [terraCoins, setTerraCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mySubmittedTasks, setMySubmittedTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
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

  // Function to get the latest distribution run ID
  const getLatestDistributionRun = async () => {
    try {
      const distributionSnap = await firestore()
        .collection('distribution')
        .orderBy('completedAt', 'desc')
        .limit(1)
        .get();

      if (distributionSnap.empty) {
        console.log("No distribution runs found");
        return null;
      }

      const latestDistribution = distributionSnap.docs[0].data();
      console.log("Latest distribution:", latestDistribution.runId, "date:", latestDistribution.date);
      return {
        runId: latestDistribution.runId,
        date: latestDistribution.date
      };
    } catch (error) {
      console.error("Error fetching latest distribution:", error);
      return null;
    }
  };

  // Function to get assigned verification tasks from the latest distribution only
  const getLatestAssignedVerificationTasks = async (userId) => {
    try {
      const latestDistribution = await getLatestDistributionRun();
      if (!latestDistribution) {
        return [];
      }

      const userRef = firestore().collection('users').doc(userId);
      const assignedVerificationsSnap = await userRef.collection('assigned_verifications').get();
      
      if (assignedVerificationsSnap.empty) {
        return [];
      }

      const latestTasks = [];
      const expectedDocId = `${latestDistribution.date}_${latestDistribution.runId}`;
      
      console.log("Looking for document:", expectedDocId);

      // Process only the document that matches the latest distribution
      for (const doc of assignedVerificationsSnap.docs) {
        if (doc.id === expectedDocId) {
          const data = doc.data();
          
          // Extract tasks from the document (each field is a task)
          Object.keys(data).forEach(key => {
            const taskData = data[key];
            if (taskData && taskData.status === 'pending') {
              latestTasks.push({
                id: key, // Use the composite key as id
                ...taskData,
                docId: doc.id // Store the document ID for reference
              });
            }
          });
          break; // Found the latest distribution document, no need to check others
        }
      }

      console.log(`Found ${latestTasks.length} tasks from latest distribution`);
      return latestTasks;
    } catch (error) {
      console.error("Error fetching assigned verification tasks:", error);
      return [];
    }
  };

  // MODIFIED: Function to get submitted tasks from (latest distribution date - 1, latest distribution date, latest distribution date + 1)
  const getLatestSubmittedTasks = async (userId) => {
    try {
      const latestDistribution = await getLatestDistributionRun();
      if (!latestDistribution) {
        return [];
      }

      // Calculate the date range: previous day, current day, and next day
      const latestDate = new Date(latestDistribution.date);
      
      const previousDate = new Date(latestDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = previousDate.toISOString().split('T')[0];
      
      const nextDate = new Date(latestDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      const userRef = firestore().collection('users').doc(userId);
      const latestTasks = [];

      // Fetch from three dates: previous day, current day, and next day
      const datesToCheck = [previousDateStr, latestDistribution.date, nextDateStr];
      
      for (const date of datesToCheck) {
        const verificationsRef = userRef.collection('verifications').doc(date);
        const verificationSnap = await verificationsRef.get();
        
        if (verificationSnap.exists) {
          const data = verificationSnap.data();
          
          // Extract tasks from the document
          Object.keys(data).forEach(taskId => {
            const taskData = data[taskId];
            if (taskData && taskData.status === 'pending') {
              latestTasks.push({
                id: taskId,
                ...taskData,
                submittedDate: date, // Use the actual date from the document
                taskId: taskId
              });
            }
          });
        }
      }

      console.log(`Found ${latestTasks.length} submitted tasks from dates: ${datesToCheck.join(', ')}`);
      return latestTasks;
    } catch (error) {
      console.error("Error fetching submitted tasks:", error);
      return [];
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      // Use the new functions to get only latest distribution tasks
      const [submittedTasks, assignedTasks] = await Promise.all([
        getLatestSubmittedTasks(user.uid),
        getLatestAssignedVerificationTasks(user.uid)
      ]);

      setMySubmittedTasks(submittedTasks);
      setAssignedTasks(assignedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
      <ScrollView contentContainerStyle={styles.scrollContainer} style={{ marginTop: vScale(150) }}>
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
                  source={{ uri: task.photoUrl }} 
                  style={styles.vertaskimg} 
                  defaultSource={require('../assets/images/bus.png')}
                />
                <View style={{ flex: 1, marginRight: scale(10) }}>
                  <Text style={styles.vertaskTitle}>{task.title}</Text>
                  <Text style={styles.taskDate}>Submitted: {task.submittedDate}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.taskVerifyBtn, task.status !== 'pending' && { backgroundColor: '#6A6A6A' }]}
                  disabled={task.status !== 'pending'}
                  // In TaskVerifyScreen.js, when navigating to VerifyTaskScreen
                  onPress={() => navigation.navigate('VerifyTaskScreen', { 
                    task: { 
                      ...task, 
                      submittedDate: task.submittedDate // Make sure this is passed
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