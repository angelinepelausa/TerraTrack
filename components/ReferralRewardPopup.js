import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import { scale, vScale } from '../utils/scaling';

const ReferralRewardPopup = ({ 
  visible, 
  onClaim, 
  isClaiming = false 
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome to TerraTrack!</Text>
          <Text style={styles.subtitle}>
            You've been invited by a friend! Claim your welcome rewards:
          </Text>

          <View style={styles.rewardsBox}>
            <View style={styles.rewardRow}>
              <Image
                source={require('../assets/images/TerraCoin.png')}
                style={styles.rewardIcon}
              />
              <Text style={styles.rewardText}>15 Terra Coins</Text>
            </View>
            <View style={styles.rewardRow}>
              <Image
                source={require('../assets/images/TerraPoint.png')}
                style={styles.rewardIcon}
              />
              <Text style={styles.rewardText}>50 Terra Points</Text>
            </View>

            <Image
              source={require('../assets/images/BearResult.png')}
              style={styles.bearImage}
            />
          </View>

          <TouchableOpacity
            style={[styles.claimButton, isClaiming && styles.claimButtonDisabled]}
            onPress={onClaim}
            disabled={isClaiming}
            activeOpacity={0.8}
          >
            {isClaiming ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.claimButtonText}>Claim Rewards</Text>
            )}
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
    paddingHorizontal: scale(16),
  },
  container: {
    width: '100%',
    maxWidth: scale(350),
    backgroundColor: '#131313',
    borderRadius: scale(25),
    paddingVertical: vScale(30),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#709775',
  },
  title: {
    fontSize: scale(26),
    fontWeight: 'bold',
    color: '#709775',
    textAlign: 'center',
    marginBottom: vScale(10),
    fontFamily: 'DMSans-Bold',
  },
  subtitle: {
    fontSize: scale(14),
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: vScale(20),
    lineHeight: vScale(20),
    fontFamily: 'DMSans-Medium',
    paddingHorizontal: scale(10),
  },
  rewardsBox: {
    backgroundColor: '#CCCCCC',
    borderRadius: scale(25),
    width: '100%',
    paddingVertical: vScale(40),
    paddingHorizontal: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: vScale(20),
    borderWidth: 2,
    borderColor: '#415D43',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vScale(15),
    width: '100%',
  },
  rewardIcon: {
    width: scale(40),
    height: scale(40),
    resizeMode: 'contain',
    marginRight: scale(15),
  },
  rewardText: {
    color: '#131313',
    fontSize: scale(18),
    fontWeight: 'bold',
    fontFamily: 'DMSans-Bold',
  },
  bearImage: {
    position: 'absolute',
    bottom: scale(-40),
    right: scale(-70),
    width: scale(180),
    height: scale(180),
    resizeMode: 'contain',
    zIndex: 2,
  },
  claimButton: {
    backgroundColor: '#415D43',
    borderRadius: scale(25),
    paddingVertical: vScale(16),
    paddingHorizontal: scale(20),
    width: '90%',
    alignItems: 'center',
    marginTop: vScale(10),
    borderWidth: 2,
    borderColor: '#709775',
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'DMSans-Bold',
  },
});

export default ReferralRewardPopup;