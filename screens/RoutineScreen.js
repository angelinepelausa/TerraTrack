import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { tasksRepository } from '../repositories/tasksRepository';
import Button from '../components/Button';
import TaskCard from '../components/taskCard';
import { scale, vScale } from '../utils/scaling';
import { getUserTerraCoins } from '../repositories/userRepository';

const { width } = Dimensions.get('window');

const RoutineScreen = () => {
  const { user } = useAuth();
  const [easyTasks, setEasyTasks] = useState([]);
  const [hardTasks, setHardTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('easy');
  const [selectedTask, setSelectedTask] = useState(null);
  const [verifyEnabled, setVerifyEnabled] = useState(false);
  const [terraCoins, setTerraCoins] = useState(0);

  const fetchAllTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [easy, hard] = await Promise.all([
        tasksRepository.getEasyTasks(),
        tasksRepository.getHardTasks(),
      ]);
      setEasyTasks(easy);
      setHardTasks(hard);
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
        if (user) {
          fetchTerraCoins();
        }
      }, [user]);
    
      const fetchTerraCoins = async () => {
        try {
          const result = await getUserTerraCoins(user.uid); 
          if (result.success) {
            setTerraCoins(result.terraCoins);
          }
        } catch (error) {
          console.error('Error fetching TerraCoins:', error);
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
    <TaskCard
      task={item}
      onPress={(task) => setSelectedTask(task)}
      onAdd={() => setVerifyEnabled((prev) => !prev)}
    />
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
          {['easy', 'hard'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab === 'easy' ? 'easy' : 'hard')}
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
            { backgroundColor: verifyEnabled ? '#415D43' : '#6A6A6A' },
          ]}
          textStyle={styles.verifyText}
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
  coinImage: {
    width: scale(20),
    height: scale(20),
    marginRight: scale(5),
    resizeMode: 'contain',
  },
  coinText: { color: '#131313', fontWeight: 'bold', fontSize: scale(12) },

  header: {
    color: '#CCCCCC',
    fontSize: 20,
    fontFamily: 'DMSans-Bold',
    marginBottom: 12,
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#CCCCCC',
    alignItems: 'center',
  },
  activeTab: { backgroundColor: '#415D43' },
  tabText: { color: '#131313', fontWeight: 'bold' },
  activeTabText: { color: '#FFFFFF' },

  list: { paddingBottom: 100 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 20 },

  verifyWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  verifyBtn: {
    paddingVertical: 18,
    borderRadius: 30,
  },
  verifyText: { color: '#CCCCCC' },

  detailContainer: {
    flex: 1,
    backgroundColor: '#131313',
    padding: 16,
  },
  backBtn: { marginBottom: 16 },
  backText: { color: '#CCCCCC', fontSize: 14 },

  descWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
});

export default RoutineScreen;