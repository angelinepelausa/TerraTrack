import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import firestore from '@react-native-firebase/firestore';

const SuspensionPopup = ({ userId, visible, onClose }) => {
  const [userData, setUserData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (userId && visible) {
      fetchUserData();
    }
  }, [userId, visible]);

  useEffect(() => {
    let interval;
    if (userData && userData.status === 'suspended' && userData.suspensionEnd) {
      interval = setInterval(calculateTimeRemaining, 1000);
    }
    return () => clearInterval(interval);
  }, [userData]);

  const fetchUserData = async () => {
    try {
      const doc = await firestore().collection('users').doc(userId).get();
      if (doc.exists) {
        setUserData(doc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const calculateTimeRemaining = () => {
    if (!userData?.suspensionEnd) return;

    const now = new Date();
    const endTime = userData.suspensionEnd.toDate();
    const difference = endTime - now;

    if (difference <= 0) {
      setTimeRemaining('Suspension ended');
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
  };

  if (!userData) return null;

  const { status, suspendedCount, suspensionReason } = userData;

  // Warning Popup (suspendCount = 1)
  if (status === 'active' && suspendedCount === 1) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.warningTitle}>⚠️ Warning</Text>
            <Text style={styles.modalText}>
              You have received a warning for violating our community guidelines.
            </Text>
            <Text style={styles.reasonText}>Reason: {suspensionReason || 'Community Guidelines Violation'}</Text>
            <Text style={styles.modalText}>
              Further violations may result in temporary or permanent suspension.
            </Text>
            <TouchableOpacity style={styles.understandButton} onPress={onClose}>
              <Text style={styles.buttonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Suspension Popup (suspendCount = 2-4)
  if (status === 'suspended' && suspendedCount >= 2 && suspendedCount <= 4) {
    const suspensionDurations = {
      2: '1 day',
      3: '7 days', 
      4: '30 days'
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.suspendedTitle}>🚫 Account Suspended</Text>
            <Text style={styles.modalText}>
              Your account has been suspended for {suspensionDurations[suspendedCount]}.
            </Text>
            <Text style={styles.reasonText}>Reason: {suspensionReason || 'Community Guidelines Violation'}</Text>
            <Text style={styles.timeRemainingText}>Time remaining: {timeRemaining}</Text>
            <Text style={styles.modalText}>
              You will not be able to use the app until the suspension period ends.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Banned Popup (suspendCount >= 5)
  if (status === 'banned' && suspendedCount >= 5) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.bannedTitle}>🔴 Account Banned</Text>
            <Text style={styles.modalText}>
              Your account has been permanently banned from TerraTrack.
            </Text>
            <Text style={styles.reasonText}>Reason: {suspensionReason || 'Repeated Community Guidelines Violations'}</Text>
            <Text style={styles.modalText}>
              This decision is final and cannot be appealed.
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: scale(15),
    padding: scale(20),
    alignItems: 'center',
    borderWidth: 2,
  },
  warningTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: vScale(10),
    textAlign: 'center',
  },
  suspendedTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: vScale(10),
    textAlign: 'center',
  },
  bannedTitle: {
    fontSize: scale(20),
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: vScale(10),
    textAlign: 'center',
  },
  modalText: {
    fontSize: scale(14),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: vScale(8),
    lineHeight: scale(18),
  },
  reasonText: {
    fontSize: scale(13),
    color: '#709775',
    textAlign: 'center',
    marginBottom: vScale(8),
    fontWeight: '600',
    fontStyle: 'italic',
  },
  timeRemainingText: {
    fontSize: scale(16),
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: vScale(8),
    fontWeight: 'bold',
  },
  understandButton: {
    backgroundColor: '#709775',
    paddingVertical: vScale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(25),
    marginTop: vScale(10),
    minWidth: scale(120),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SuspensionPopup;