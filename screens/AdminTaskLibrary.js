import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HeaderSearchRow from '../components/HeaderSearchRow';
import TaskDisplay from '../components/TaskDisplay'; 
import { tasksRepository } from '../repositories/tasksRepository';

const AdminTaskLibrary = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const allTasks = await tasksRepository.getAllTasks();
      setTasks(allTasks);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const easyTasks = tasks
    .filter(t => t.difficulty === 'easy')
    .filter(t => (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const hardTasks = tasks
    .filter(t => t.difficulty === 'hard')
    .filter(t => (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const handleTaskPress = (task) => {
    navigation.navigate('AddTask', { task, onSaved: fetchTasks });
  };

  const handleDelete = (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await tasksRepository.deleteTask(taskId);
              setTasks(prev => prev.filter(t => t.id !== taskId));
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete task');
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderSearchRow
        title="Task Library"
        onBackPress={() => navigation.goBack()}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPress={() => navigation.navigate('AddTask', { onSaved: fetchTasks })}
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#709775" />
        </View>
      ) : (
        <TaskDisplay
          easyTasks={easyTasks}
          hardTasks={hardTasks}
          onTaskPress={handleTaskPress}
          onDelete={handleDelete} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313', padding: 16, paddingTop: 40 },
});

export default AdminTaskLibrary;
