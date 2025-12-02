// components/ReferralRewardPopup.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';

const ReferralRewardPopup = ({ visible, onClaim, isClaiming = false }) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => {}} // Block closing - must claim
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Welcome Bonus!</Text>
          <Text style={styles.subtitle}>
            You joined TerraTrack using a friend's referral!
          </Text>

          <View style={styles.rewardsBox}>
            <View style={styles.rewardItem}>
              <Image
                source={require('../assets/images/TerraCoin.png')}
                style={styles.rewardIcon}
              />
              <View style={styles.rewardDetails}>
                <Text style={styles.rewardAmount}>+15</Text>
                <Text style={styles.rewardText}>Terra Coins</Text>
              </View>
            </View>
            
            <View style={styles.rewardItem}>
              <Image
                source={require('../assets/images/TerraPoint.png')}
                style={styles.rewardIcon}
              />
              <View style={styles.rewardDetails}>
                <Text style={styles.rewardAmount}>+50</Text>
                <Text style={styles.rewardText}>Terra Points</Text>
              </View>
            </View>

            <Image
              source={require('../assets/images/BearResult.png')}
              style={styles.bearImage}
            />
          </View>

          <Text style={styles.note}>
            One-time welcome gift for joining through referral
          </Text>

          <TouchableOpacity
            style={[
              styles.claimButton,
              isClaiming && styles.claimButtonDisabled
            ]}
            onPress={onClaim}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.claimButtonText}>Claiming...</Text>
              </>
            ) : (
              <Text style={styles.claimButtonText}>Claim Reward</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardsBox: {
    backgroundColor: '#CCCCCC',
    borderRadius: 20,
    width: '100%',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 15,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    justifyContent: 'center',
  },
  rewardIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 15,
  },
  rewardDetails: {
    alignItems: 'flex-start',
  },
  rewardAmount: {
    color: '#131313',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rewardText: {
    color: '#131313',
    fontSize: 14,
    fontWeight: '600',
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
  note: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  claimButton: {
    backgroundColor: '#415D43',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  claimButtonDisabled: {
    opacity: 0.7,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ReferralRewardPopup;