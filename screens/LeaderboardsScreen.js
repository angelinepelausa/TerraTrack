import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardData, setRewardData] = useState(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!user?.uid) return;

      setLoading(true);

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
      }
    };

    loadLeaderboard();
  }, [user?.uid]);

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#709775" />
        </View>
      ) : (
        <Leaderboard
          leaderboard={leaderboard}
          currentUserRank={currentUserRank}
          currentUserId={user?.uid}
          loading={loading}
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
  );
};

export default LeaderboardsScreen;
