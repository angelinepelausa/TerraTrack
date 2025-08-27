import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';

const TaskDisplay = ({ easyTasks, hardTasks, onTaskPress, onDelete }) => {
  const [activeTab, setActiveTab] = useState('easy');
  const [easyList, setEasyList] = useState(easyTasks);
  const [hardList, setHardList] = useState(hardTasks);

  useEffect(() => setEasyList(easyTasks), [easyTasks]);
  useEffect(() => setHardList(hardTasks), [hardTasks]);

  const tasks = activeTab === 'easy' ? easyList : hardList;

  const renderTask = ({ item }) => (
    <TouchableOpacity
      style={styles.taskRow}
      activeOpacity={0.8}
      onPress={() => onTaskPress && onTaskPress(item)}
    >
      {item.imageurl ? (
        <Image source={{ uri: item.imageurl }} style={styles.taskImage} />
      ) : (
        <View style={[styles.taskImage, { backgroundColor: '#555' }]} />
      )}

      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskDesc}>{item.description}</Text>
      </View>

      <TouchableOpacity onPress={() => onDelete && onDelete(item.id)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabContainer}>
        {['easy', 'hard'].map(tab => (
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
  );
};

const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  activeTab: { backgroundColor: '#415D43' },
  tabText: { color: '#bbb', fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
  list: { paddingBottom: 100 },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskImage: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  taskDesc: { color: '#aaa', fontSize: 12, marginTop: 2 },
  deleteText: { color: '#ff4d4d', fontWeight: 'bold', marginLeft: 12 },
});

export default TaskDisplay;
