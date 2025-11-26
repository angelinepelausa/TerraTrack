import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, vScale } from '../utils/scaling';

const ConfirmationPopup = ({ 
  visible, 
  onConfirm, 
  onCancel, 
  title, 
  message, 
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
  type = "success"
}) => {
  const getColors = () => {
    return type === 'success' 
      ? { primary: '#709775', secondary: '#415D43' }
      : { primary: '#FF4444', secondary: '#CC0000' };
  };

  const colors = getColors();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={[styles.title, { color: colors.primary }]}>
            {title}
          </Text>
          
          <Text style={styles.message}>
            {message}
          </Text>

          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
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
    lineHeight: scale(20),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: scale(10),
  },
  button: {
    flex: 1,
    borderRadius: scale(30),
    paddingVertical: vScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#666666',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: scale(14),
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: scale(14),
  },
});

export default ConfirmationPopup;