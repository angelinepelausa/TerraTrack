import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { getLeaderboard } from '../repositories/leaderboardRepository';
import { useAuth } from '../context/AuthContext';

import Avatar from '../assets/images/Avatar.png';
import Crown from '../assets/images/Crown.png';

const LeaderboardsScreen = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Leaderboards</Text>

      {/* Podium */}
      <View style={styles.podium}>
        {top3[1] && (
          <View style={[styles.podiumItem, { marginTop: 40 }]}>
            <RankedAvatar user={top3[1]} currentUserId={user?.uid} />
          </View>
        )}

        {top3[0] && (
          <View style={[styles.podiumItem, { marginBottom: 30 }]}>
            <Image source={Crown} style={styles.crown} />
            <RankedAvatar user={top3[0]} currentUserId={user?.uid} />
          </View>
        )}

        {top3[2] && (
          <View style={[styles.podiumItem, { marginTop: 40 }]}>
            <RankedAvatar user={top3[2]} currentUserId={user?.uid} />
          </View>
        )}
      </View>

      {rest.length > 0 && (
        <View style={styles.restContainer}>
          {rest.map((item) => {
            const isCurrentUser = item.id === user?.uid;
            const highlight = isCurrentUser && item.rank >= 4 && item.rank <= 10;

            return (
              <View
                key={item.id}
                style={[
                  styles.listItem,
                  highlight && { backgroundColor: "#415D43" },
                ]}
              >
                <Text
                  style={[
                    styles.listRank,
                    highlight && { color: "#D9D9D9", backgroundColor: "transparent" },
                  ]}
                >
                  {item.rank}
                </Text>
                <Image source={Avatar} style={styles.listAvatar} />
                <Text
                  style={[
                    styles.listUsername,
                    highlight && { color: "#D9D9D9" },
                  ]}
                >
                  {item.username}
                </Text>
                <Text
                  style={[
                    styles.listPoints,
                    highlight && { color: "#D9D9D9" },
                  ]}
                >
                  {item.terraPoints} pts
                </Text>
              </View>
            );
          })}
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
        style={[
          styles.avatar,
          isCurrentUser && { borderWidth: 3, borderColor: '#415D43', borderRadius: 45 },
        ]}
      />
      <View style={styles.rankCircle}>
        <Text style={styles.rankText}>{user.rank}</Text>
      </View>
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.points}>{user.terraPoints} pts</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',          
    justifyContent: 'center',      
    paddingVertical: 20,
    paddingBottom: 0
  },
  title: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 40,
    fontWeight: 'bold',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: 10,
  },
  podiumItem: {
    alignItems: 'center',
  },
  crown: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
    position: 'absolute',
    top: -5,
    zIndex: 2,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginHorizontal: 10,
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  rankCircle: {
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
  },
  rankText: {
    color: '#CCCCCC',
    fontWeight: 'bold',
  },
  username: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CCCCCC',
  },
  points: {
    color: '#CCCCCC',
    fontSize: 10,
  },
  restContainer: {
    backgroundColor: '#111D13',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    width: '100%',
    alignSelf: 'center',
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 6,
    alignItems: 'center',
  },
  listRank: {
    fontWeight: 'bold',
    color: '#131313',
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  listAvatar: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
  },
  listUsername: {
    fontWeight: 'bold',
    flex: 1,
    color: '#131313',
  },
  listPoints: {
    fontWeight: 'bold',
    color: '#131313',
    fontSize: 12,
  },
});

export default LeaderboardsScreen;
