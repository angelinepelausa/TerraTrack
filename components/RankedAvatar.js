import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Avatar from '../assets/images/Avatar.png';

const RankedAvatar = ({ user, rank }) => {
  return (
    <View style={styles.container}>
      <Image source={Avatar} style={styles.avatar} />
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.points}>{user.terraPoints} pts</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 10,
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
  },
  rankBadge: {
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
    fontSize: 12,
  },
  username: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CCCCCC',
  },
  points: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 2,
  },
});

export default RankedAvatar;