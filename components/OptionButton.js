import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { scale, vScale } from '../utils/scaling';

const OptionButton = ({ label, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.button, isSelected && styles.selectedButton]}
      onPress={onPress}
    >
      <View style={styles.radioContainer}>
        {isSelected && <View style={styles.selectedRadio} />}
      </View>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CBCBCB',
    borderRadius: 30,
    paddingVertical: vScale(15),
    paddingHorizontal: scale(20),
    marginBottom: vScale(15),
    width: scale(308),
  },
  selectedButton: {
    backgroundColor: '#E8F5E9',
  },
  radioContainer: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 1,
    backgroundColor: '#FEFEFE', 
    borderColor: '#FEFEFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  selectedRadio: {
    width: scale(20), 
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: '#415D43',
  },
  buttonText: {
    color: '#131313',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(12), 
  },
});

export default OptionButton;