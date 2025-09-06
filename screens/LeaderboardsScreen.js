import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { getLeaderboard, getUserRank } from '../repositories/leaderboardRepository';
import { useAuth } from '../context/AuthContext';
import Leaderboard from '../components/Leaderboard';

const LeaderboardsScreen = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [topUsers, userRank] = await Promise.all([
          getLeaderboard(10),
          getUserRank(user?.uid),
        ]);

        setLeaderboard(topUsers);
        setCurrentUserRank(userRank);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  return (
    <Leaderboard
      leaderboard={leaderboard}
      currentUserRank={currentUserRank}
      currentUserId={user?.uid}
      loading={loading}
    />
  );
};

export default LeaderboardsScreen;