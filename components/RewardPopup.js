// components/RewardPopup.js - SIMPLIFIED
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';

const RewardPopup = ({ visible, onClose, rewards }) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.subtitle}>You've earned rewards from the last cycle!</Text>

          <View style={styles.rewardsBox}>
            <View style={styles.rewardRow}>
              <Image
                source={require('../assets/images/TerraCoin.png')}
                style={styles.rewardIcon}
              />
              <Text style={styles.rewardText}>
                {rewards.coins} Terra Coin{rewards.coins !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.rewardRow}>
              <Image
                source={require('../assets/images/TerraPoint.png')}
                style={styles.rewardIcon}
              />
              <Text style={styles.rewardText}>{rewards.points} Terra Points</Text>
            </View>

            <Image
              source={require('../assets/images/BearResult.png')}
              style={styles.bearImage}
            />
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={onClose}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
    paddingHorizontal: 16,
  },
  container: {
    width: '90%',
    backgroundColor: '#131313',
    borderRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#709775',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardsBox: {
    backgroundColor: '#CCCCCC',
    borderRadius: 25,
    width: '100%',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
  },
  rewardText: {
    color: '#131313',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bearImage: {
    position: 'absolute',
    bottom: -40,
    right: -70,
    width: 180,
    height: 180,
    resizeMode: 'contain',
    zIndex: 2,
  },
  continueButton: {
    backgroundColor: '#415D43',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '90%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#DDDDDD',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RewardPopup;