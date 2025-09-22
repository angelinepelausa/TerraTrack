import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { scale, vScale } from '../utils/scaling';

const TaskCard = ({ task, onPress, onAdd }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleAddPress = () => {
    const newClicked = !isClicked;
    setIsClicked(newClicked);
    onAdd(task, newClicked);
  };

  return (
    <View style={styles.card}>
      {/* ✅ Task image */}
      {task.imageUrl ? (
        <Image source={{ uri: task.imageUrl }} style={styles.taskImage} />
      ) : null}

      <TouchableOpacity
        onPress={() => onPress(task)}
        activeOpacity={0.8}
        style={styles.titleWrapper}
      >
        <Text style={styles.title}>{task.title}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleAddPress}
        style={styles.addBtnContainer}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Image
          source={
            isClicked
              ? require('../assets/images/addButtonClicked.png')
              : require('../assets/images/addButton.png')
          }
          style={styles.addBtn}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: vScale(75),
    backgroundColor: '#CCCCCC',
    borderRadius: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    marginBottom: vScale(12),
    justifyContent: 'space-between',
  },
  taskImage: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(8),
    marginRight: scale(12),
    resizeMode: 'cover',
  },
  titleWrapper: { flex: 1 },
  title: {
    fontSize: scale(14),
    fontFamily: 'DMSans-Bold',
    color: '#131313',
  },
  addBtnContainer: {
    padding: scale(6),
  },
  addBtn: {
    width: scale(24),
    height: scale(24),
    resizeMode: 'contain',
  },
});

export default TaskCard;
