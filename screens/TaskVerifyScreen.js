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

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user) {
      fetchTerraCoins();
      fetchTasks(); // ✅ only fetch, no assigning
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

  const fetchTasks = async () => {
  try {
    // --- My submitted tasks (from user log) ---
    const mySnap = await firestore()
      .collection("users")
      .doc(user.uid)
      .collection("verifications")
      .doc(today)
      .get();

    let myTasks = [];
    if (mySnap.exists) {
      const myData = mySnap.data() || {};
      myTasks = Object.entries(myData)
        .filter(([key]) => key !== "dailyEasyTasks")
        .map(([taskId, task]) => ({
          id: taskId,
          title: task?.title || "Unknown Task",
          status: task?.status || "pending",
          photoUrl: task?.photoUrl || null,
        }));
    }
    setMySubmittedTasks(myTasks);

    // --- Assigned tasks (loop over all runs today) ---
    const assignedSnap = await firestore()
      .collection("users")
      .doc(user.uid)
      .collection("assigned_verifications")
      .get();

    let assigned = [];
    assignedSnap.forEach((doc) => {
      if (doc.id.startsWith(today)) {  // 👈 only today’s runs
        const data = doc.data();
        const tasks = Object.entries(data).map(([taskId, task]) => ({
          id: taskId,
          title: task?.title || "Untitled Task",
          photoUrl: task?.photoUrl || null,
          status: task?.status || "pending",
          userId: task?.ownerId || "unknown",
        }));
        assigned.push(...tasks);
      }
    });

    setAssignedTasks(assigned);
  } catch (error) {
    console.error("Error fetching verification tasks:", error);
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image source={require('../assets/images/TerraCoin.png')} style={styles.coinImage} />
          <Text style={styles.coinText}>{terraCoins}</Text>
        </View>
      </View>

      {/* Back + Filter */}
      <View style={styles.backandfilter}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/icons/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Image source={require("../assets/icons/filter.png")} style={styles.filterIcon} />
      </View>

      {/* My Submitted Tasks */}
      <Text style={styles.taskverText}>Task Verification</Text>
      <View style={styles.tasksContainer}>
        {mySubmittedTasks.length === 0 ? (
          <Text style={{ color: "#aaa", textAlign: "center" }}>No submitted tasks yet.</Text>
        ) : (
          mySubmittedTasks.map((task) => (
            <View style={styles.taskCard} key={task.id}>
              {task.photoUrl ? (
                <Image source={{ uri: task.photoUrl }} style={styles.taskimg} />
              ) : (
                <Image source={require('../assets/images/bus.png')} style={styles.taskimg} />
              )}
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskStatus}>{task.status}</Text>
            </View>
          ))
        )}
      </View>

      {/* Assigned Tasks */}
      <Text style={styles.vertaskText}>Verify Task</Text>
      <View style={styles.vertaskContainer}>
        {assignedTasks.length === 0 ? (
          <Text style={{ color: "#aaa", textAlign: "center" }}>No tasks assigned for verification.</Text>
        ) : (
          assignedTasks.map((task) => (
            <View style={styles.vertaskCard} key={task.id}>
              <Image source={{ uri: task.photoUrl }} style={styles.vertaskimg} />
              <TouchableOpacity
                style={styles.taskVerifyBtn}
                onPress={() => navigation.navigate("VerifyTask", { task })}
              >
                <Text style={styles.taskVerifyText}>Verify</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  scrollContainer: { paddingBottom: vScale(30) },
  topBar: {
    height: vScale(110),
    backgroundColor: '#415D43',
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: scale(10),
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
  backandfilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    marginTop: vScale(15),
  },
  backIcon: { width: 60, height: 60, resizeMode: "contain", tintColor: "#fff" },
  filterIcon: { width: 28, height: 28, resizeMode: "contain", tintColor: "#fff" },
  tasksContainer: { padding: scale(15), marginTop: vScale(15), width: '100%' },
  taskCard: {
    backgroundColor: '#CCCCCC',
    borderRadius: scale(15),
    padding: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vScale(15),
  },
  taskimg: { width: 50, height: 50, marginRight: scale(20) },
  taskTitle: {
    fontSize: scale(13),
    fontWeight: 'bold',
    color: '#131313',
    flexShrink: 1,
    marginRight: scale(30),
  },
  taskStatus: { fontSize: scale(10), color: '#555555' },
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
  },
  vertaskimg: { width: 55, height: 55, marginRight: scale(20) },
  taskVerifyBtn: {
    backgroundColor: '#415D43',
    borderRadius: scale(15),
    padding: scale(7),
    width: scale(100),
    alignItems: 'center',
    marginLeft: 'auto',
  },
  taskVerifyText: { color: '#FFFFFF', fontSize: scale(12), fontWeight: 'bold' },
});

export default TaskVerifyScreen;
