import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Clipboard } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getUserReferralCode, addUserRewards } from '../repositories/userRepository';
import { scale, vScale } from '../utils/scaling';

const InviteScreen = ({ navigation }) => {
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = auth().currentUser;
        if (!user) {
          setError('User not logged in');
          setLoading(false);
          return;
        }

        const result = await getUserReferralCode(user.uid);
        if (result.success) setReferralCode(result.referralCode);
        else setError(result.error || 'Failed to fetch referral code');

        const invitesSnap = await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('invites')
          .get();

        const invitesData = await Promise.all(invitesSnap.docs.map(async doc => {
          const data = doc.data();
          const userDoc = await firestore().collection('users').doc(doc.id).get();
          const username = userDoc.exists ? userDoc.data().username : 'Unknown';
          return {
            id: doc.id,
            username,
            taskFinished: data.taskFinished || 0,
            educationalQuizFinished: data.educationalQuizFinished || 0,
            weeklyQuizFinished: data.weeklyQuizFinished || 0,
            rewardsClaimed: data.rewardsClaimed || false
          };
        }));

        setInvites(invitesData);
      } catch (err) {
        console.error(err);
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const copyToClipboard = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const handleClaimPrize = async (inviteId) => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      const rewardResult = await addUserRewards(user.uid, 15, 50);
      if (!rewardResult.success) {
        Alert.alert('Error', 'Failed to claim prize');
        return;
      }

      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('invites')
        .doc(inviteId)
        .update({ rewardsClaimed: true });

      setInvites(prev => prev.map(inv => inv.id === inviteId ? { ...inv, rewardsClaimed: true } : inv));
      Alert.alert('Rewards Claimed');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to claim prize');
    }
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
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backIcon}>{'<'}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Invite a friend</Text>

        {/* Referral Code */}
        <View style={styles.referralContainer}>
          <Image source={require('../assets/images/BearInvite.png')} style={styles.bearImage} />
          <View style={styles.referralCard}>
            <View style={styles.referralCodeContainer}>
              <Text style={styles.referralCode}>{referralCode}</Text>
              <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                <Image source={require('../assets/images/CopyIcon.png')} style={styles.copyIcon} />
              </TouchableOpacity>
            </View>
            <Text style={styles.referralLabel}>Invitation Code</Text>
          </View>
        </View>

        {/* Rewards */}
        <View style={styles.rewardsCard}>
          <Text style={styles.rewardsTitle}>Earn rewards by inviting a{'\n'}friend to join TerraTrack</Text>
          <View style={styles.rewardItem}>
            <Image source={require('../assets/images/TerraCoin.png')} style={{ width: 20, height: 20, marginRight: 5 }} />
            <Text style={styles.rewardText}>15 Terra Coins</Text>
          </View>
          <View style={styles.rewardItem}>
            <Image source={require('../assets/images/TerraPoint.png')} style={{ width: 20, height: 20, marginRight: 5 }} />
            <Text style={styles.rewardText}>50 Terra Points</Text>
          </View>
        </View>

        {/* Invites Section */}
        <Text style={[styles.title, { marginTop: vScale(30) }]}>Your Invites</Text>
        {invites.length === 0 ? (
          <Text style={{ color: '#CCCCCC', marginTop: vScale(10) }}>No invites yet</Text>
        ) : (
          invites.map(inv => (
            <View key={inv.id} style={styles.inviteCard}>
              <Text style={styles.inviteUsername}>{inv.username}</Text>

              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Tasks</Text>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(inv.taskFinished / 20 * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{inv.taskFinished} / 20</Text>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Educational Quiz</Text>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(inv.educationalQuizFinished / 5 * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{inv.educationalQuizFinished} / 5</Text>
              </View>

              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Weekly Quiz</Text>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(inv.weeklyQuizFinished / 1 * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{inv.weeklyQuizFinished} / 1</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.claimButton,
                  inv.rewardsClaimed && { backgroundColor: '#666666' }
                ]}
                onPress={() => !inv.rewardsClaimed && handleClaimPrize(inv.id)}
                disabled={inv.rewardsClaimed}
              >
                <Text style={styles.claimButtonText}>
                  {inv.rewardsClaimed ? 'Claimed' : 'Claim Rewards'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313', paddingTop: vScale(40) },
  contentContainer: { padding: scale(25), alignItems: 'center' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  backButton: { position: 'absolute', top: scale(20), left: scale(20), zIndex: 10, padding: scale(10) },
  backIcon: { color: '#CCCCCC', fontSize: scale(24), fontWeight: 'bold' },
  title: { color: '#CCCCCC', fontSize: scale(18), fontWeight: 'bold', textAlign: 'center', marginBottom: vScale(20) },
  referralContainer: { alignItems: 'center', marginBottom: vScale(20) },
  bearImage: { width: scale(300), height: scale(300), resizeMode: 'contain', marginBottom: vScale(-40), zIndex: 3 },
  referralCard: { backgroundColor: '#CCCCCC', borderRadius: scale(25), padding: scale(25), alignItems: 'center', justifyContent: 'center', width: scale(320) },
  referralCodeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: vScale(5) },
  referralCode: { color: '#415D43', fontSize: scale(30), fontWeight: 'bold', textAlign: 'center', marginRight: scale(10) },
  copyButton: { padding: scale(5) },
  copyIcon: { width: scale(15), height: scale(15), resizeMode: 'contain' },
  referralLabel: { color: '#131313', fontSize: scale(12), textAlign: 'center' },
  rewardsCard: { backgroundColor: '#415D43', borderRadius: scale(25), padding: scale(25), alignItems: 'center', width: scale(320), marginBottom: vScale(20) },
  rewardsTitle: { color: '#CCCCCC', fontSize: scale(16), fontWeight: 'bold', textAlign: 'center', marginBottom: vScale(10), lineHeight: scale(20) },
  rewardItem: { flexDirection: 'row', alignItems: 'center', marginBottom: vScale(10) },
  rewardText: { color: '#CCCCCC', fontSize: scale(14), fontWeight: '400' },
  inviteCard: { backgroundColor: '#1E1E1E', padding: scale(20), borderRadius: scale(20), width: scale(320), marginBottom: vScale(15), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  inviteUsername: { color: '#709775', fontWeight: 'bold', fontSize: scale(16), marginBottom: vScale(10) },
  progressContainer: { marginBottom: vScale(8) },
  progressLabel: { color: '#CCCCCC', fontSize: scale(12), marginBottom: vScale(3) },
  progressBarBackground: { width: '100%', height: vScale(8), backgroundColor: '#333', borderRadius: scale(5) },
  progressBarFill: { height: vScale(8), backgroundColor: '#709775', borderRadius: scale(5) },
  progressText: { color: '#CCCCCC', fontSize: scale(12), textAlign: 'right', marginTop: vScale(2) },
  claimButton: { backgroundColor: '#709775', padding: vScale(10), borderRadius: scale(12), marginTop: vScale(10), alignItems: 'center' },
  claimButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  errorText: { color: 'red', textAlign: 'center', marginTop: vScale(10) },
});

export default InviteScreen;
