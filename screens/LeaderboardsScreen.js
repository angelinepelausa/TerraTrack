import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Leaderboard from '../components/Leaderboard';
import RewardPopup from '../components/RewardPopup';
import { getLeaderboard, getUserRank, getUserLastReward } from '../repositories/leaderboardRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LeaderboardsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (!user?.uid) return;

    if (!isManualRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // Fetch leaderboard + user rank in parallel
      const [topUsers, userRank] = await Promise.all([
        getLeaderboard(10),
        getUserRank(user.uid),
      ]);
      setLeaderboard(topUsers);
      setCurrentUserRank(userRank);

      // Only check rewards if user has a rank
      if (userRank) {
        const reward = await getUserLastReward(user.uid);

        if (reward && (reward.terraCoins > 0 || reward.terraPoints > 0)) {
          const rewardKey = `rewardShown_${user.uid}_${reward.cycleDate}`;
          const alreadyShown = await AsyncStorage.getItem(rewardKey);

          // Show popup only if not shown before for this user & cycle
          if (!alreadyShown) {
            setRewardData(reward);
            setShowRewardPopup(true);
            await AsyncStorage.setItem(rewardKey, 'true');
          }
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard/reward:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  return (
    <ScrollView 
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#CCCCCC"
          colors={["#415D43"]}
        />
      }
    >
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <ActivityIndicator size="large" color="#709775" />
          </View>
        ) : (
          <Leaderboard
            leaderboard={leaderboard}
            currentUserRank={currentUserRank}
            currentUserId={user?.uid}
            loading={loading}
            // Remove refresh props since parent handles refresh
            onRefresh={null}
            refreshing={false}
          />
        )}

        {showRewardPopup && rewardData && (
          <RewardPopup
            visible={showRewardPopup}
            rewards={{
              coins: rewardData.terraCoins,
              points: rewardData.terraPoints,
            }}
            onClose={() => setShowRewardPopup(false)}
            navigation={navigation}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default LeaderboardsScreen;