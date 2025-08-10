import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, vScale } from '../utils/scaling';

const ProgressIndicator = ({ currentStep, totalSteps, onStepPress }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onStepPress(index)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.step,
              index === currentStep 
                ? styles.activeStep 
                : index < currentStep 
                  ? styles.completedStep 
                  : styles.inactiveStep
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vScale(30),
  },
  step: {
    marginHorizontal: scale(4),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  activeStep: {
    width: scale(24),
    backgroundColor: '#709775', 
  },
  inactiveStep: {
    backgroundColor: '#DDDDDD', 
  },
  completedStep: {
    backgroundColor: '#DDDDDD',
  },
});

export default ProgressIndicator;