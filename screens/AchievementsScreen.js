import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { badgesRepository } from '../repositories/badgesRepository';
import firestore from '@react-native-firebase/firestore';
import HeaderRow from '../components/HeaderRow';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AchievementsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockedBadges, setUnlockedBadges] = useState({});
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [claimedBadge, setClaimedBadge] = useState(null);
  const scaleAnim = useState(new Animated.Value(0))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadUnlockedBadges = async () => {
    const unlocked = await badgesRepository.getUnlockedBadgesForUser(user.uid);
    setUnlockedBadges(unlocked);
    return unlocked;
  };

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
      const unlocked = await loadUnlockedBadges();

      const categories = {};
      badgesData.forEach((badge) => {
        const key = badge.category.toLowerCase();
        if (!categories[key]) categories[key] = [];
        categories[key].push(badge);
      });

      Object.keys(categories).forEach((key) => {
        categories[key].sort((a, b) => a.targetNumber - b.targetNumber);
      });

      const currentTierBadges = [];
      const claimedBadges = [];

      Object.keys(categories).forEach((cat) => {
        // CORRECTED CATEGORY MAPPING
        let userValue;
        if (cat === 'tasks') {
          userValue = statsData.taskFinished;
        } else if (cat === 'weekly quiz') {
          userValue = statsData.educationalQuizFinished;
        } else if (cat === 'educational materials') {
          userValue = statsData.educationalMaterialsRead;
        } else {
          userValue = 0; // fallback
        }

        const categoryBadges = categories[cat];

        // Collect claimed badges
        categoryBadges.forEach((b) => {
          if (unlocked[b.id]) claimedBadges.push({ ...b, category: cat });
        });

        // Current tier = first badge not yet claimed
        const currentBadge = categoryBadges.find((b) => !unlocked[b.id]);
        if (currentBadge) currentTierBadges.push({ ...currentBadge, category: cat });
      });

      // Show current tier badges first, claimed badges at bottom
      setBadges([...currentTierBadges, ...claimedBadges]);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimBadge = async (badge) => {
    try {
      await badgesRepository.unlockBadgeForUser(user.uid, badge.id);
      setClaimedBadge(badge);
      setShowCongratsModal(true);

      // Animate modal
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Refresh badges after claiming
      await loadAchievements();
    } catch (err) {
      console.error('Error claiming badge:', err);
    }
  };

  const renderAchievement = ({ item }) => {
    if (!stats) return null;

    // CORRECTED CATEGORY MAPPING (same as above)
    let userValue;
    if (item.category === 'tasks') {
      userValue = stats.taskFinished;
    } else if (item.category === 'weekly quiz') {
      userValue = stats.educationalQuizFinished;
    } else if (item.category === 'educational materials') {
      userValue = stats.educationalMaterialsRead;
    } else {
      userValue = 0;
    }

    const progress = Math.min(userValue / item.targetNumber, 1);
    const progressText = `${userValue}/${item.targetNumber}`;
    const reachedGoal = userValue >= item.targetNumber;
    const isClaimed = unlockedBadges[item.id];

    return (
      <TouchableOpacity
        style={styles.achievementCard}
        onPress={() =>
          navigation.navigate('AchievementDetailScreen', { currentBadge: item })
        }
      >
        <Image source={{ uri: item.imageurl }} style={styles.achievementImage} />
        <View style={styles.achievementDetails}>
          <Text style={styles.achievementTitle}>{item.name}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            <Text style={styles.progressText}>{progressText}</Text>
          </View>
          {reachedGoal && !isClaimed && (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={(e) => {
                e.stopPropagation();
                claimBadge(item);
              }}
            >
              <Text style={styles.claimButtonText}>Claim Badge</Text>
            </TouchableOpacity>
          )}
          {isClaimed && (
            <View style={styles.claimedContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#415D43" />
              <Text style={styles.claimedText}>Achievement Unlocked</Text>
            </View>
          )}
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

      {/* Premium Congrats Modal */}
      {showCongratsModal && claimedBadge && (
        <Modal transparent animationType="fade" visible={showCongratsModal}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
              ]}
            >
              <Image source={{ uri: claimedBadge.imageurl }} style={styles.modalBadgeImage} />
              <Text style={styles.modalTitle}>Congratulations!</Text>
              <Text style={styles.modalBadgeName}>{claimedBadge.name}</Text>
              <Text style={styles.modalMessage}>You have unlocked a new badge.</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCongratsModal(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  headerContainer: { paddingHorizontal: 18, paddingVertical: 10 },
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
  progressContainer: { height: 24, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', marginTop: 6 },
  progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#415D43' },
  progressText: { alignSelf: 'center', fontSize: 14, fontWeight: 'bold', color: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  claimButton: { marginTop: 8, backgroundColor: '#415D43', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start' },
  claimButtonText: { color: '#fff', fontWeight: 'bold' },
  claimedContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  claimedText: { marginLeft: 6, color: '#415D43', fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalBadgeImage: { width: 100, height: 100, marginBottom: 16, resizeMode: 'contain' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#415D43', marginBottom: 8 },
  modalBadgeName: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 8 },
  modalMessage: { fontSize: 16, color: '#000', marginBottom: 16, textAlign: 'center' },
  modalButton: { backgroundColor: '#415D43', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default AchievementsScreen;