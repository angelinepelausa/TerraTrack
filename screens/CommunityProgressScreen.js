import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getCommunityProgress, getCommunityLeaderboard, getUserCommunityRank } from '../repositories/communityProgressRepository';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';
import { vScale } from '../utils/scaling';

import Avatar from '../assets/images/Avatar.png';
import Crown from '../assets/images/Crown.png';
import TerraCoin from '../assets/images/TerraCoin.png';
import TerraPoint from '../assets/images/TerraPoint.png';

const CommunityProgressScreen = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [progress, topUsers, userRank] = await Promise.all([
          getCommunityProgress(),           // fetch current quarter
          getCommunityLeaderboard(),       // fetch leaderboard
          getUserCommunityRank(user?.uid), // fetch current user's rank
        ]);

        if (progress) setProgressData(progress);
        if (topUsers) setLeaderboard(topUsers);
        if (userRank) setCurrentUserRank(userRank);
      } catch (error) {
        console.error('Failed to load community progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} color="#415D43" />;

  if (!progressData) return (
    <View style={styles.center}>
      <Text style={styles.error}>No community progress data found.</Text>
    </View>
  );

  const { description, current, goal, rewards, image } = progressData;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 10);
  const isBeyond3 = currentUserRank && currentUserRank.rank > 3;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Community Impact</Text>

      {image && (
        <Image 
          source={{ uri: image }} 
          style={styles.communityImage} 
          resizeMode="cover"
        />
      )}

      <Text style={styles.description}>{description}</Text>

      <View style={styles.progressBox}>
        <Text style={styles.progressHeader}>Community Progress</Text>
        <Text style={styles.progressTitle}>
          Finish {current} / {goal} tasks
        </Text>
        <View style={{ marginTop: vScale(8), width: '90%' }}>
          <ProgressBar
            progress={goal > 0 ? (current / goal) * 100 : 0}
            style={{
              height: vScale(10),
              borderRadius: vScale(5),
              backgroundColor: '#CCCCCC',
              filledColor: '#415D43',
            }}
          />
        </View>
      </View>

      {rewards && (
        <View style={styles.rewardsCard}>
          <Text style={styles.rewardsTitle}>Leaderboard Rewards</Text>
          {[
            { label: 'Top 1', reward: rewards.top1 },
            { label: 'Top 2', reward: rewards.top2 },
            { label: 'Top 3', reward: rewards.top3 },
            { label: 'Top 4-10', reward: rewards.top4to10 },
            { label: 'Top 11+', reward: rewards.top11plus },
          ].map((item, index, arr) => (
            <View key={item.label}>
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>{item.label}</Text>
                <View style={styles.rewardMiddle}>
                  <Image source={TerraPoint} style={styles.rewardIcon} />
                  <Text style={styles.rewardText}>{item.reward.terraPoints}</Text>
                </View>
                <View style={styles.rewardRight}>
                  <Text style={styles.rewardText}>{item.reward.terraCoins}</Text>
                  <Image source={TerraCoin} style={styles.rewardIcon} />
                </View>
              </View>
              {index < arr.length - 1 && <View style={styles.rewardDivider} />}
            </View>
          ))}
        </View>
      )}

      <Text style={styles.title}>Top Contributors</Text>

      <View style={styles.podium}>
        {top3[1] && (
          <View style={[styles.podiumItem, { marginTop: 30 }]}>
            <RankedAvatar user={top3[1]} currentUserId={user?.uid} />
          </View>
        )}
        {top3[0] && (
          <View style={[styles.podiumItem, { marginBottom: 20 }]}>
            <Image source={Crown} style={styles.crown} />
            <RankedAvatar user={top3[0]} currentUserId={user?.uid} />
          </View>
        )}
        {top3[2] && (
          <View style={[styles.podiumItem, { marginTop: 30 }]}>
            <RankedAvatar user={top3[2]} currentUserId={user?.uid} />
          </View>
        )}
      </View>

      {rest.length > 0 && (
        <View style={styles.restContainer}>
          {rest.map((item) => {
            const highlight = isBeyond3 && item.id === currentUserRank.id;
            return (
              <View
                key={item.id}
                style={[styles.listItem, highlight && { backgroundColor: "#415D43", paddingVertical: 4 }]}
              >
                <Text style={[styles.listRank, highlight && { color: "#D9D9D9", backgroundColor: "transparent" }]}>{item.rank}</Text>
                <Image source={Avatar} style={styles.listAvatar} />
                <Text style={[styles.listUsername, highlight && { color: "#D9D9D9" }]}>{item.username}</Text>
                <Text style={[styles.listPoints, highlight && { color: "#D9D9D9" }]}>{item.terraPoints} pts</Text>
              </View>
            );
          })}

          {isBeyond3 && currentUserRank.rank > 10 && (
            <View style={[styles.listItem, { backgroundColor: "#415D43", marginTop: 10, paddingVertical: 4 }]}>
              <Text style={[styles.listRank, { color: "#D9D9D9", backgroundColor: "transparent" }]}>{currentUserRank.rank}</Text>
              <Image source={Avatar} style={styles.listAvatar} />
              <Text style={[styles.listUsername, { color: "#D9D9D9" }]}>{currentUserRank.username}</Text>
              <Text style={[styles.listPoints, { color: "#D9D9D9" }]}>{currentUserRank.terraPoints} pts</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const RankedAvatar = ({ user, currentUserId }) => {
  const isCurrentUser = user.id === currentUserId;
  return (
    <View style={styles.avatarWrapper}>
      <Image
        source={Avatar}
        style={[{ width: 90, height: 90 }, isCurrentUser && { borderWidth: 3, borderColor: '#415D43', borderRadius: 45 }]}
      />
      <View style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: [{ translateX: -14 }],
        backgroundColor: '#415D43',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
      }}>
        <Text style={styles.rankText}>{user.rank}</Text>
      </View>
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.points}>{user.terraPoints} pts</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 20, alignItems: 'center', backgroundColor: '#000', paddingBottom: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  error: { color: 'red', fontSize: 16 },
  title: { fontSize: 18, color: '#CCCCCC', textAlign: 'center', marginTop: 40, marginBottom: 20, fontWeight: 'bold' },
  communityImage: { width: '90%', height: 180, borderRadius: 15, marginVertical: 15, alignSelf: 'center' },
  description: { color: '#CCCCCC', fontSize: 14, textAlign: 'center', margin: 20, marginTop: 0 },

  progressBox: { width: '90%', backgroundColor: '#CCCCCC', borderRadius: 15, padding: 15, alignItems: 'center' },
  progressHeader: { fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: '#131313' },
  progressTitle: { fontWeight: 'bold', fontSize: 15, marginBottom: 4, color: '#415D43' },

  rewardsCard: { width: '90%', marginTop: 30, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 18, backgroundColor: '#1B2B20' },
  rewardsTitle: { color: '#CCCCCC', fontWeight: 'bold', fontSize: 16, marginBottom: 12, textAlign: 'center' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rewardLabel: { color: '#CCCCCC', fontSize: 14, fontWeight: 'bold', width: 80 },
  rewardMiddle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  rewardRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  rewardIcon: { width: 20, height: 20, marginHorizontal: 4 },
  rewardText: { color: '#CCCCCC', fontSize: 14, fontWeight: 'bold' },
  rewardDivider: { height: 1, backgroundColor: '#415D43', marginVertical: 6, opacity: 0.4 },

  podium: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', width: '100%', marginBottom: 10 },
  podiumItem: { alignItems: 'center' },
  crown: { width: 35, height: 35, resizeMode: 'contain', position: 'absolute', top: -5, zIndex: 2 },
  avatarWrapper: { alignItems: 'center', marginHorizontal: 10, position: 'relative' },
  rankText: { color: '#CCCCCC', fontWeight: 'bold' },
  username: { marginTop: 10, fontSize: 14, fontWeight: 'bold', color: '#CCCCCC' },
  points: { color: '#CCCCCC', fontSize: 10 },

  restContainer: { backgroundColor: '#111D13', borderRadius: 15, paddingHorizontal: 20, paddingVertical: 10, marginTop: 10, width: '100%', alignSelf: 'center' },
  listItem: { flexDirection: 'row', backgroundColor: '#D9D9D9', borderRadius: 10, paddingHorizontal: 10, marginVertical: 6, alignItems: 'center' },
  listRank: { fontWeight: 'bold', color: '#131313', backgroundColor: '#D9D9D9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginRight: 10 },
  listAvatar: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
  listUsername: { fontWeight: 'bold', flex: 1, color: '#131313' },
  listPoints: { fontWeight: 'bold', color: '#131313', fontSize: 12 },
});

export default CommunityProgressScreen;
