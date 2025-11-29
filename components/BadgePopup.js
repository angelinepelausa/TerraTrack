import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions
} from 'react-native';
import { scale, vScale } from '../utils/scaling';

const { width, height } = Dimensions.get('window');

const BadgePopup = ({ visible, badge, onClose }) => {
  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.overlay} />
        <View style={styles.popupContainer}>
          <View style={styles.badgeContainer}>
            {/* You Earned a Badge Text */}
            <Text style={styles.earnedText}>You Earned a Badge!</Text>
            
            {/* Badge Image */}
            <Image 
              source={{ uri: badge.imageurl }} 
              style={styles.badgeImage}
            />
            
            {/* Badge Name */}
            <Text style={styles.badgeName}>{badge.name}</Text>
            
            {/* Congratulation Message */}
            <Text style={styles.congratsText}>Start of Journey!</Text>
            <Text style={styles.badgeMessage}>
              Welcome to TerraTrack! You've taken your first step towards making a positive environmental impact.
            </Text>
          </View>
          
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Let's Go!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  popupContainer: {
    width: width * 0.85,
    backgroundColor: '#1E1E1E',
    borderRadius: scale(25),
    padding: scale(25),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#415D43',
    shadowColor: '#415D43',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: vScale(25),
  },
  earnedText: {
    color: '#FFFFFF',
    fontSize: scale(20),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: vScale(15),
  },
  badgeImage: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    marginBottom: vScale(20),
    borderWidth: 3,
    borderColor: '#709775',
  },
  badgeName: {
    color: '#709775',
    fontSize: scale(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: vScale(8),
  },
  congratsText: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: vScale(12),
  },
  badgeMessage: {
    color: '#CCCCCC',
    fontSize: scale(14),
    textAlign: 'center',
    lineHeight: scale(20),
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#415D43',
    paddingVertical: vScale(14),
    paddingHorizontal: scale(40),
    borderRadius: scale(25),
    borderWidth: 2,
    borderColor: '#709775',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: 'bold',
  },
});

export default BadgePopup;