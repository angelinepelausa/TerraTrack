import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Avatar from '../assets/images/Avatar.png';
import Crown from '../assets/images/Crown.png';

const Leaderboard = ({
  leaderboard = [],
  currentUserRank = null,
  currentUserId = null,
  loading = false,
  showTitle = true,
}) => {
  const navigation = useNavigation();

  const processedLeaderboard = React.useMemo(() => {
    if (!leaderboard.length) return [];

    const sorted = [...leaderboard].sort((a, b) => {
      if (b.terraPoints !== a.terraPoints) {
        return b.terraPoints - a.terraPoints;
      }
      return a.username.localeCompare(b.username);
    });

    let currentRank = 1;
    let previousPoints = null;

    return sorted.map((item, index) => {
      if (previousPoints !== null && item.terraPoints === previousPoints) {
        return { ...item, rank: currentRank };
      }
      currentRank = index + 1;
      previousPoints = item.terraPoints;
      return { ...item, rank: currentRank };
    });
  }, [leaderboard]);

  const handleUserPress = (user) => {
    if (user.id === currentUserId) {
      navigation.navigate('ProfileScreen', { userId: user.id }); 
    } else {
      navigation.navigate('PublicProfileScreen', { userId: user.id });
    }
  };

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

  const RankedAvatar = ({ user, currentUserId, avatarSize, rankCircleSize }) => {
    const isCurrentUser = user.id === currentUserId;
    return (
      <TouchableOpacity 
        style={styles.avatarWrapper}
        onPress={() => handleUserPress(user)}
      >
        <Image
          source={user.avatarUrl ? { uri: user.avatarUrl } : Avatar}
          style={[
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
            isCurrentUser && { borderWidth: 3, borderColor: '#415D43' },
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {showTitle && <Text style={styles.title}>Leaderboards</Text>}

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
              <TouchableOpacity 
                key={item.id}
                onPress={() => handleUserPress(item)}
              >
                <View
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
                  <Image
                    source={item.avatarUrl ? { uri: item.avatarUrl } : Avatar}
                    style={styles.listAvatar}
                  />
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
              </TouchableOpacity>
            );
          })}

          {isBeyond10 && currentUserRank && (
            <TouchableOpacity 
              onPress={() => handleUserPress(currentUserRank)}
            >
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
                <Image
                  source={currentUserRank.avatarUrl ? { uri: currentUserRank.avatarUrl } : Avatar}
                  style={styles.listAvatar}
                />
                <Text style={[styles.listUsername, { color: "#D9D9D9" }]}>
                  {currentUserRank.username}
                </Text>
                <Text style={[styles.listPoints, { color: "#D9D9D9" }]}>
                  {currentUserRank.terraPoints} pts
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {processedLeaderboard.length === 0 && !loading && (
        <Text style={styles.noDataText}>No leaderboard data available</Text>
      )}
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
    borderRadius: 20,
    resizeMode: 'cover',
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
