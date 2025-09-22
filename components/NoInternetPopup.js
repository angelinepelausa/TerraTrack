import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, vScale } from '../utils/scaling';

const NoInternetPopup = ({ visible, onRetry }) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.message}>
            Please check your Wi-Fi to continue using the app.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#131313',
    borderRadius: scale(20),
    padding: scale(20),
    width: scale(300),
    alignItems: 'center',
  },
  title: {
    color: '#709775',
    fontSize: scale(18),
    fontWeight: '700',
    marginBottom: vScale(10),
    textAlign: 'center',
  },
  message: {
    color: '#CCCCCC',
    fontSize: scale(14),
    textAlign: 'center',
    marginBottom: vScale(20),
  },
  button: {
    backgroundColor: '#415D43',
    borderRadius: 30,
    paddingVertical: vScale(10),
    paddingHorizontal: scale(30),
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: scale(14),
  },
});

export default NoInternetPopup;
