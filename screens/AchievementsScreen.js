import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { badgesRepository } from '../repositories/badgesRepository';
import firestore from '@react-native-firebase/firestore';
import HeaderRow from '../components/HeaderRow';

const AchievementsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      setLoading(true);

      const statsDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('total')
        .doc('stats')
        .get();

      const statsData = statsDoc.exists
        ? statsDoc.data()
        : {
            educationalMaterialsRead: 0,
            educationalQuizFinished: 0,
            taskFinished: 0,
          };
      setStats(statsData);

      const badgesData = await badgesRepository.getAllBadges();

      const categories = {};
      badgesData.forEach((badge) => {
        const key = badge.category.toLowerCase();
        if (!categories[key]) categories[key] = [];
        categories[key].push(badge);
      });

      Object.keys(categories).forEach((key) => {
        categories[key].sort((a, b) => a.targetNumber - b.targetNumber);
      });

      const currentTierBadges = Object.keys(categories).map((cat) => {
        const userValue =
          cat === 'tasks'
            ? statsData.taskFinished
            : cat === 'quiz'
            ? statsData.educationalQuizFinished
            : statsData.educationalMaterialsRead;

        const badge = categories[cat].find((b) => userValue < b.targetNumber);
        if (badge) return { ...badge, category: cat };

        const lastBadge = categories[cat][categories[cat].length - 1];
        return { ...lastBadge, category: cat };
      });

      setBadges(currentTierBadges);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAchievement = ({ item }) => {
    if (!stats) return null;

    const userValue =
      item.category === 'tasks'
        ? stats.taskFinished
        : item.category === 'quiz'
        ? stats.educationalQuizFinished
        : stats.educationalMaterialsRead;

    const progress = Math.min(userValue / item.targetNumber, 1);
    const progressText = `${userValue}/${item.targetNumber}`;

    return (
      <TouchableOpacity
        style={styles.achievementCard}
        onPress={() =>
          navigation.navigate('AchievementDetailScreen', {
            currentBadge: item,
          })
        }
      >
        <Image source={{ uri: item.imageurl }} style={styles.achievementImage} />
        <View style={styles.achievementDetails}>
          <Text style={styles.achievementTitle}>{item.name}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            <Text style={styles.progressText}>{progressText}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#415D43" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderRow title="Achievements" onBackPress={() => navigation.goBack()} />
      </View>

      <FlatList
        data={badges}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  
  headerContainer: {
    paddingHorizontal: 18, 
    paddingVertical: 10,
  },

  listContainer: { paddingHorizontal: 18, paddingVertical: 5 },

  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  achievementImage: { width: 80, height: 80, resizeMode: 'contain', marginRight: 16 },
  achievementDetails: { flex: 1 },
  achievementTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  progressContainer: {
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#415D43',
  },
  progressText: {
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AchievementsScreen;
