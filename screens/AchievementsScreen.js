import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
} from 'react-native';
import { getUserTerraCoins } from '../repositories/userRepository';
import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';

const AchievementsScreen = () => {
  const { user } = useAuth();
  const [terraCoins, setTerraCoins] = useState(0);
  const [stats, setStats] = useState({
    educationalMaterialsRead: 0,
    educationalQuizFinished: 0,
    taskFinished: 0,
  });
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (user) {
      fetchTerraCoins();
      fetchStats();
    }
  }, [user]);

  const fetchTerraCoins = async () => {
    try {
      const result = await getUserTerraCoins(user.uid);
      if (result.success) {
        setTerraCoins(result.terraCoins || 0);
      }
    } catch (error) {
      console.error('Error fetching TerraCoins:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const docRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('total')
        .doc('stats');
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data();
        setStats({
          educationalMaterialsRead: data.educationalMaterialsRead || 0,
          educationalQuizFinished: data.educationalQuizFinished || 0,
          taskFinished: data.taskFinished || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Define tiers
  const achievementTiers = {
    quizzes: [
      { title: 'Eco-Scholar', desc: 'Finish 10 Quizzes', goal: 10, icon: require('../assets/images/quizt1.png') },
      { title: 'Eco-Visionary', desc: 'Finish 50 Quizzes', goal: 50, icon: require('../assets/images/quizt2.png') },
      { title: 'Eco-Oracle', desc: 'Finish 100 Quizzes', goal: 100, icon: require('../assets/images/quizt3.png') },
    ],
    tasks: [
      { title: 'Trailblazer', desc: 'Finish 10 Tasks', goal: 10, icon: require('../assets/images/taskt1.png') },
      { title: 'Pathfinder', desc: 'Finish 100 Tasks', goal: 100, icon: require('../assets/images/taskt2.png') },
      { title: 'Earthshaper', desc: 'Finish 500 Tasks', goal: 500, icon: require('../assets/images/taskt3.png') },
    ],
    materials: [
      { title: 'Apprentice of Knowledge', desc: 'Finish 10 Materials', goal: 10, icon: require('../assets/images/readt1.png') },
      { title: 'Scholar of Insight', desc: 'Finish 100 Materials', goal: 100, icon: require('../assets/images/readt2.png') },
      { title: 'Sage of Wisdom', desc: 'Finish 300 Materials', goal: 300, icon: require('../assets/images/readt3.png') },
    ],
  };

  // Decide which tier to show
  useEffect(() => {
    const newAchievements = [];

    const pickTier = (tiers, current) => {
      for (let i = 0; i < tiers.length; i++) {
        if (current < tiers[i].goal) {
          return {
            ...tiers[i],
            progress: current / tiers[i].goal,
            progressText: `${current}/${tiers[i].goal}`,
          };
        }
      }
      // If all tiers complete, show last as maxed
      const last = tiers[tiers.length - 1];
      return {
        ...last,
        progress: 1,
        progressText: `${last.goal}/${last.goal}`,
      };
    };

    newAchievements.push(pickTier(achievementTiers.quizzes, stats.educationalQuizFinished));
    newAchievements.push(pickTier(achievementTiers.tasks, stats.taskFinished));
    newAchievements.push(pickTier(achievementTiers.materials, stats.educationalMaterialsRead));

    setAchievements(newAchievements);
  }, [stats]);

  const renderAchievement = ({ item }) => (
    <View style={styles.achievementCard}>
      <Image source={item.icon} style={styles.achievementImage} />
      <View style={styles.achievementDetails}>
        <Text style={styles.achievementTitle}>{item.title}</Text>
        <Text style={styles.achievementDesc}>{item.desc}</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${item.progress * 100}%` }]} />
          <Text style={styles.progressText}>{item.progressText}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image
            source={require('../assets/images/TerraCoin.png')}
            style={styles.coinImage}
          />
          <Text style={styles.coinText}>{terraCoins}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Achievements</Text>

      {/* Achievements List */}
      <FlatList
        data={achievements}
        renderItem={renderAchievement}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  topBar: {
    height: 100,
    backgroundColor: '#415D43',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 12,
  },
  coinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  coinImage: { width: 28, height: 28, marginRight: 8, resizeMode: 'contain' },
  coinText: { color: '#131313', fontWeight: 'bold', fontSize: 14 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#709775',
    marginTop: 24,
    marginLeft: 20,
  },
  listContainer: { paddingHorizontal: 18, paddingVertical: 12 },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  achievementImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginRight: 16,
  },
  achievementDetails: { flex: 1 },
  achievementTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  achievementDesc: { fontSize: 14, color: '#333', marginBottom: 10 },
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
});

export default AchievementsScreen;
