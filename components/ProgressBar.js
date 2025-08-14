import React from 'react';
import { View, StyleSheet } from 'react-native';

const ProgressBar = ({ progress }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.fill, { width: `${Math.min(progress, 100)}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 281,
    height: 41,
    borderRadius: 20,
    backgroundColor: '#FFFDFD',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#415D43',
  },
});

export default ProgressBar;
