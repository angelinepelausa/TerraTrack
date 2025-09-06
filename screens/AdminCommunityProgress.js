import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
  Alert, Platform, UIManager
} from 'react-native';
import { 
  getCommunityProgress, 
  getCommunityLeaderboard, 
  getUpcomingQuarters,
  deleteCommunityProgress
} from '../repositories/communityProgressRepository';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';
import { useNavigation } from '@react-navigation/native';
import { vScale } from '../utils/scaling';

import Avatar from '../assets/images/Avatar.png';
import Crown from '../assets/images/Crown.png';
import TerraCoin from '../assets/images/TerraCoin.png';
import TerraPoint from '../assets/images/TerraPoint.png';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AdminCommunityProgress = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [progressData, setProgressData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingQuarters, setUpcomingQuarters] = useState([]);
  const [expandedQuarter, setExpandedQuarter] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progress, topUsers, upcoming] = await Promise.all([
        getCommunityProgress(),
        getCommunityLeaderboard(),
        getUpcomingQuarters(),
      ]);

      if (progress) setProgressData(progress);
      if (topUsers) setLeaderboard(topUsers);
      if (upcoming) setUpcomingQuarters(upcoming);
    } catch (error) {
      console.error('Failed to load community progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuarter = (quarterId) => {
    setExpandedQuarter(expandedQuarter === quarterId ? null : quarterId);
  };

  const handleEditQuarter = (quarter) => {
    navigation.navigate('AddCommunityProgress', { 
      quarterData: quarter,
      onSaved: () => {
        setLoading(true);
        loadData();
      }
    });
  };

  const handleDeleteQuarter = (quarterId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this quarter?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          onPress: async () => {
            try {
              await deleteCommunityProgress(quarterId);
              setLoading(true);
              loadData();
            } catch (err) {
              console.error(err);
              Alert.alert("Error deleting quarter.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} color="#415D43" />;

  if (!progressData) return (
    <View style={styles.center}>
      <Text style={styles.error}>No community progress data found.</Text>
    </View>
  );

  const { title, description, current, goal, rewards, image, startDate, endDate } = progressData;

  const now = new Date();
  const end = endDate ? new Date(endDate) : new Date();
  const timeLeftMs = end - now;
  const daysLeft = Math.max(Math.floor(timeLeftMs / (1000 * 60 * 60 * 24)), 0);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 10);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title || 'Community Impact'}</Text>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.timeLeft}>Time left: {daysLeft} day(s)</Text>

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

      {/* Upcoming Community Goals Section */}
      {upcomingQuarters.length > 0 && (
        <View style={styles.upcomingContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Community Goals</Text>
            <TouchableOpacity 
              style={styles.smallAddButton} 
              onPress={() => navigation.navigate('AddCommunityProgress', { onSaved: () => loadData() })}
            >
              <Text style={styles.smallAddButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingQuarters.map((quarter) => (
            <View key={quarter.id} style={styles.quarterItem}>
              <TouchableOpacity 
                style={styles.quarterHeader}
                onPress={() => toggleQuarter(quarter.id)}
              >
                <Text style={styles.quarterTitle}>{quarter.id}</Text>
                <Text style={styles.quarterArrow}>
                  {expandedQuarter === quarter.id ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              
              {expandedQuarter === quarter.id && (
                <View style={styles.quarterDetails}>
                  <Text style={styles.quarterDescription}>{quarter.description}</Text>
                  <Text style={styles.quarterGoal}>Goal: {quarter.goal} tasks</Text>
                  <Text style={styles.quarterDates}>
                    {new Date(quarter.startDate).toLocaleDateString()} - {new Date(quarter.endDate).toLocaleDateString()}
                  </Text>
                  
                  {quarter.rewards && (
                    <View style={styles.quarterRewards}>
                      <Text style={styles.rewardsSubtitle}>Rewards:</Text>
                      {[
                        { label: 'Top 1', reward: quarter.rewards.top1 },
                        { label: 'Top 2', reward: quarter.rewards.top2 },
                        { label: 'Top 3', reward: quarter.rewards.top3 },
                        { label: 'Top 4-10', reward: quarter.rewards.top4to10 },
                        { label: 'Top 11+', reward: quarter.rewards.top11plus },
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

                  {/* Edit and Delete Buttons */}
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#709775", marginRight: 10 }]}
                      onPress={() => handleEditQuarter(quarter)}
                    >
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: "#CC3A3A" }]}
                      onPress={() => handleDeleteQuarter(quarter.id)}
                    >
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Text style={styles.title}>Top Contributors</Text>
      <View style={styles.podium}>
        {top3[1] && (
          <View style={[styles.podiumItem, { marginTop: 30 }]}>
            <RankedAvatar user={top3[1]} />
          </View>
        )}
        {top3[0] && (
          <View style={[styles.podiumItem, { marginBottom: 20 }]}>
            <Image source={Crown} style={styles.crown} />
            <RankedAvatar user={top3[0]} />
          </View>
        )}
        {top3[2] && (
          <View style={[styles.podiumItem, { marginTop: 30 }]}>
            <RankedAvatar user={top3[2]} />
          </View>
        )}
      </View>

      {rest.length > 0 && (
        <View style={styles.restContainer}>
          {rest.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <Text style={styles.listRank}>{item.rank}</Text>
              <Image source={Avatar} style={styles.listAvatar} />
              <Text style={styles.listUsername}>{item.username}</Text>
              <Text style={styles.listPoints}>{item.terraPoints} pts</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const RankedAvatar = ({ user }) => (
  <View style={styles.avatarWrapper}>
    <Image source={Avatar} style={{ width: 90, height: 90 }} />
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

const styles = StyleSheet.create({
  container: { paddingVertical: 20, alignItems: 'center', backgroundColor: '#000', paddingBottom: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  error: { color: 'red', fontSize: 16, marginBottom: 12 },

  title: { fontSize: 18, color: '#CCCCCC', textAlign: 'center', marginTop: 40, marginBottom: 20, fontWeight: 'bold' },
  description: { color: '#CCCCCC', fontSize: 14, textAlign: 'center', marginHorizontal: 20, marginBottom: 10 },
  timeLeft: { color: '#CCCCCC', fontSize: 14, marginBottom: 20 },

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

  image: { width: '90%', height: 200, borderRadius: 15, marginBottom: 10 },
  

  upcomingContainer: { width: '100%', paddingHorizontal: 20, marginBottom: 20},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 30,
  },
  sectionTitle: { fontSize: 18, color: '#CCCCCC', fontWeight: 'bold', textAlign: 'left', flex: 1 },
  smallAddButton: {
    backgroundColor: '#709775',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAddButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  quarterItem: { marginBottom: 15, backgroundColor: '#1E1E1E', borderRadius: 12, overflow: 'hidden' },
  quarterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  quarterTitle: { color: '#709775', fontWeight: '600', fontSize: 16 },
  quarterArrow: { color: '#709775', fontWeight: '600', fontSize: 16 },
  quarterDetails: { padding: 14, backgroundColor: '#222' },
  quarterDescription: { color: '#CCCCCC', marginBottom: 10 },
  quarterGoal: { color: '#CCCCCC', marginBottom: 5, fontWeight: '600' },
  quarterDates: { color: '#CCCCCC', marginBottom: 15, fontStyle: 'italic' },
  quarterRewards: { marginTop: 10 },
  rewardsSubtitle: { color: '#CCCCCC', fontWeight: 'bold', marginBottom: 10 },
  
  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  actionButton: { alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 15, flex: 1 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default AdminCommunityProgress;
