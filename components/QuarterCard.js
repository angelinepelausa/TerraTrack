import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const QuarterCard = ({ quarter, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>{quarter.id}</Text>
        <Text style={styles.dates}>
          {new Date(quarter.startDate).toLocaleDateString()} - {new Date(quarter.endDate).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {quarter.description}
      </Text>
      <Text style={styles.goal}>Goal: {quarter.goal} tasks</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#709775',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    color: '#709775',
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  dates: {
    color: '#888',
    fontSize: 12,
    marginLeft: 8,
  },
  description: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 18,
  },
  goal: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default QuarterCard;