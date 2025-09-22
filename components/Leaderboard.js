import React from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import Avatar from '../assets/images/Avatar.png';
import Crown from '../assets/images/Crown.png';

const Leaderboard = ({
  leaderboard = [], // default to empty array
  currentUserRank = null,
  currentUserId = null,
  loading = false,
}) => {
  // Process leaderboard data to handle ties
  const processedLeaderboard = React.useMemo(() => {
    if (!leaderboard.length) return [];
    
    // Sort by terraPoints descending, then by username ascending for consistent ordering
    const sorted = [...leaderboard].sort((a, b) => {
      if (b.terraPoints !== a.terraPoints) {
        return b.terraPoints - a.terraPoints;
      }
      return a.username.localeCompare(b.username);
    });
    
    // Assign ranks with ties
    let currentRank = 1;
    let previousPoints = null;
    
    return sorted.map((item, index) => {
      // If same points as previous item, use same rank
      if (previousPoints !== null && item.terraPoints === previousPoints) {
        return { ...item, rank: currentRank };
      }
      
      // Different points, increment rank
      currentRank = index + 1;
      previousPoints = item.terraPoints;
      return { ...item, rank: currentRank };
    });
  }, [leaderboard]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#CCCCCC" />
      </View>
    );
  }

  const top3 = processedLeaderboard.slice(0, 3);
  const rest = processedLeaderboard.slice(3, 10);

  const isBeyond10 = currentUserRank && currentUserRank.rank > 10;
  const listItemPaddingVertical = isBeyond10 ? 4 : 6;
  const podiumAvatarSize = isBeyond10 ? 70 : 90;
  const rankCircleSize = isBeyond10 ? 20 : 28;
  const restContainerPaddingVertical = isBeyond10 ? 5 : 10;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboards</Text>

      <View style={styles.podium}>
        {top3[1] && (
          <View style={[styles.podiumItem, { marginTop: 30 }]}>
            <RankedAvatar
              user={top3[1]}
              currentUserId={currentUserId}
              avatarSize={podiumAvatarSize}
              rankCircleSize={rankCircleSize}
            />
          </View>
        )}

        {top3[0] && (
          <View style={[styles.podiumItem, { marginBottom: 20 }]}>
            <Image source={Crown} style={styles.crown} />
            <RankedAvatar
              user={top3[0]}
              currentUserId={currentUserId}
              avatarSize={podiumAvatarSize}
              rankCircleSize={rankCircleSize}
            />
          </View>
        )}

        {top3[2] && (
          <View style={[styles.podiumItem, { marginTop: 30 }]}>
            <RankedAvatar
              user={top3[2]}
              currentUserId={currentUserId}
              avatarSize={podiumAvatarSize}
              rankCircleSize={rankCircleSize}
            />
          </View>
        )}
      </View>

      {rest.length > 0 && (
        <View
          style={[
            styles.restContainer,
            { paddingVertical: restContainerPaddingVertical },
          ]}
        >
          {rest.map((item) => {
            const isCurrentUser = item.id === currentUserId;
            const highlight = isCurrentUser && item.rank >= 4 && item.rank <= 10;

            return (
              <View
                key={item.id}
                style={[
                  styles.listItem,
                  { paddingVertical: listItemPaddingVertical },
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

          {isBeyond10 && currentUserRank && (
            <View
              style={[
                styles.listItem,
                { backgroundColor: "#415D43", marginTop: 10, paddingVertical: 4 },
              ]}
            >
              <Text
                style={[
                  styles.listRank,
                  { color: "#D9D9D9", backgroundColor: "transparent" },
                ]}
              >
                {currentUserRank.rank}
              </Text>
              <Image source={Avatar} style={styles.listAvatar} />
              <Text style={[styles.listUsername, { color: "#D9D9D9" }]}>
                {currentUserRank.username}
              </Text>
              <Text style={[styles.listPoints, { color: "#D9D9D9" }]}>
                {currentUserRank.terraPoints} pts
              </Text>
            </View>
          )}
        </View>
      )}

      {processedLeaderboard.length === 0 && !loading && (
        <Text style={styles.noDataText}>No leaderboard data available</Text>
      )}
    </View>
  );
};

const RankedAvatar = ({ user, currentUserId, avatarSize, rankCircleSize }) => {
  const isCurrentUser = user.id === currentUserId;

  return (
    <View style={styles.avatarWrapper}>
      <Image
        source={Avatar}
        style={[
          { width: avatarSize, height: avatarSize },
          isCurrentUser && { borderWidth: 3, borderColor: '#415D43', borderRadius: avatarSize / 2 },
        ]}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: [{ translateX: -rankCircleSize / 2 }],
          backgroundColor: '#415D43',
          width: rankCircleSize,
          height: rankCircleSize,
          borderRadius: rankCircleSize / 2,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 3,
        }}
      >
        <Text style={styles.rankText}>{user.rank}</Text>
      </View>
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.points}>{user.terraPoints} pts</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#000',
    paddingBottom: 30,
    minHeight: 400,
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
    marginTop: 10,
    width: '100%',
    alignSelf: 'center',
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
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
  noDataText: {
    color: '#CCCCCC',
    marginTop: 20,
    fontSize: 16,
  },
});

export default Leaderboard;