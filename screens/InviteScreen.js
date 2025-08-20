import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Clipboard } from 'react-native';
import auth from '@react-native-firebase/auth';
import { getUserReferralCode } from '../repositories/userRepository';
import { scale, vScale } from '../utils/scaling';

const InviteScreen = ({ navigation }) => {
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReferralCode = async () => {
      try {
        setLoading(true);
        const user = auth().currentUser;
        if (!user) {
          setError('User not logged in');
          setLoading(false);
          return;
        }

        const result = await getUserReferralCode(user.uid);
        if (result.success) {
          setReferralCode(result.referralCode);
        } else {
          setError(result.error || 'Failed to fetch referral code');
        }
      } catch (err) {
        console.error('Error fetching referral code:', err);
        setError('Error loading referral code');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralCode();
  }, []);

  const copyToClipboard = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#415D43" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={styles.backButton}
      >
        <Text style={styles.backIcon}>{'<'}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Invite a friend</Text>
        
        <View style={styles.referralContainer}>
          <Image 
            source={require('../assets/images/BearInvite.png')} 
            style={styles.bearImage} 
          />
          <View style={styles.referralCard}>
            <View style={styles.referralCodeContainer}>
              <Text style={styles.referralCode}>{referralCode}</Text>
              <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                <Image 
                  source={require('../assets/images/CopyIcon.png')} 
                  style={styles.copyIcon} 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.referralLabel}>Invitation Code</Text>
          </View>
        </View>

        <View style={styles.rewardsCard}>
          <Text style={styles.rewardsTitle}>
            Earn rewards by inviting a{'\n'}
            friend to join TerraTrack
          </Text>
          
          <View style={styles.rewardItem}>
            <Text style={styles.rewardText}>15 Terra Coins</Text>
          </View>
          
          <View style={styles.rewardItem}>
            <Text style={styles.rewardText}>50 Terra Points</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  contentContainer: {
    padding: scale(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: scale(20),
    left: scale(20),
    zIndex: 10,
    padding: scale(10),
  },
  backIcon: {
    color: '#CCCCCC',
    fontSize: scale(24),
    fontWeight: 'bold',
  },
  title: {
    color: '#CCCCCC',
    fontSize: scale(18),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: vScale(40),
    marginTop: vScale(40),
  },
  referralContainer: {
    alignItems: 'center',
    marginBottom: vScale(20),
    zIndex: 2,
  },
  bearImage: {
    width: scale(300),
    height: scale(300),
    resizeMode: 'contain',
    marginBottom: vScale(-40),
    zIndex: 3,
  },
  referralCard: {
    backgroundColor: '#CCCCCC',
    borderRadius: scale(25),
    padding: scale(25),
    alignItems: 'center',
    justifyContent: 'center',
    width: scale(320),
    zIndex: 1,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vScale(5),
  },
  referralCode: {
    color: '#415D43',
    fontSize: scale(30),
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: scale(10),
  },
  copyButton: {
    padding: scale(5),
  },
  copyIcon: {
    width: scale(15),
    height: scale(15),
    resizeMode: 'contain',
  },
  referralLabel: {
    color: '#131313',
    fontSize: scale(12),
    textAlign: 'center',
  },
  rewardsCard: {
    backgroundColor: '#415D43',
    borderRadius: scale(25),
    padding: scale(25),
    alignItems: 'center',
    width: scale(320),
  },
  rewardsTitle: {
    color: '#CCCCCC',
    fontSize: scale(16),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: vScale(20),
    lineHeight: scale(20),
  },
  rewardItem: {
    marginBottom: vScale(12),
  },
  rewardText: {
    color: '#CCCCCC',
    fontSize: scale(14),
    fontWeight: '400',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: 'red',
    padding: scale(10),
    borderRadius: scale(5),
    marginTop: vScale(20),
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: scale(12),
  },
});

export default InviteScreen;