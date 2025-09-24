import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { badgesRepository } from '../repositories/badgesRepository';
import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import HeaderRow from '../components/HeaderRow';

const AchievementDetailScreen = ({ route, navigation }) => {
  const { currentBadge } = route.params;
  const { user } = useAuth();
  const [nextBadge, setNextBadge] = useState(null);
  const [stats, setStats] = useState(null);
  const [allCategoryBadges, setAllCategoryBadges] = useState([]);

  useEffect(() => {
    fetchStatsAndNextBadge();
  }, [currentBadge]);

  const fetchStatsAndNextBadge = async () => {
    try {
      // Fetch user stats
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

      // Get all badges in the current badge's category, sorted by targetNumber
      const categoryBadges = await badgesRepository.getBadgesByCategorySorted(currentBadge.category);
      setAllCategoryBadges(categoryBadges);

      // Find the current badge's position and get the next one
      const currentIndex = categoryBadges.findIndex(
        badge => badge.id === currentBadge.id
      );

      if (currentIndex !== -1 && currentIndex < categoryBadges.length - 1) {
        // Next badge is the one with the next higher targetNumber
        setNextBadge(categoryBadges[currentIndex + 1]);
      } else {
        setNextBadge(null); // No next badge (this is the highest tier)
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (!stats) return null;

  const userValue =
    currentBadge.category.toLowerCase() === 'tasks'
      ? stats.taskFinished
      : currentBadge.category.toLowerCase() === 'quiz'
      ? stats.educationalQuizFinished
      : stats.educationalMaterialsRead;

  const progress = Math.min(userValue / currentBadge.targetNumber, 1);
  const progressText = `${userValue}/${currentBadge.targetNumber}`;
  const progressPercentage = Math.round(progress * 100);
  const remainingForNext = nextBadge ? nextBadge.targetNumber - userValue : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderRow 
          title={currentBadge.name} 
          onBackPress={handleBackPress} 
        />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Achievement Card */}
        <View style={styles.currentCard}>
          <Image source={{ uri: currentBadge.imageurl }} style={styles.image} />
          <Text style={styles.title}>{currentBadge.name}</Text>
          <Text style={styles.categoryTag}>{currentBadge.category} Achievement</Text>
          <Text style={styles.description}>{currentBadge.description}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{progressText} completed</Text>
          </View>
        </View>

        {/* Next Achievement Section */}
        {nextBadge ? (
          <View style={styles.nextSection}>
            <Text style={styles.nextSectionTitle}>Continue Your Journey</Text>
            <View style={styles.nextCard}>
              <View style={styles.nextBadgeHeader}>
                <Image source={{ uri: nextBadge.imageurl }} style={styles.nextImage} />
                <View style={styles.nextBadgeInfo}>
                  <Text style={styles.nextName}>{nextBadge.name}</Text>
                  <Text style={styles.nextTier}>Next Level</Text>
                </View>
              </View>
              
              <View style={styles.targetContainer}>
                <Text style={styles.targetLabel}>Goal to reach next tier:</Text>
                <View style={styles.targetRow}>
                  <Text style={styles.targetNumber}>{nextBadge.targetNumber}</Text>
                  <Text style={styles.targetText}>{currentBadge.category}</Text>
                </View>
              </View>
              
              <Text style={styles.motivationText}>
                {remainingForNext} more to go. You're making great progress toward your next achievement.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.maxTierSection}>
            <Text style={styles.maxTierTitle}>Master Level Achieved</Text>
            <Text style={styles.maxTierSubtitle}>Highest tier in {currentBadge.category}</Text>
            <Text style={styles.maxTierText}>
              You have reached the pinnacle of this category. Continue your excellent work and inspire others with your dedication.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },

  // Current Achievement Card
  currentCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  categoryTag: {
    fontSize: 14,
    textAlign: 'center',
    color: '#709775',
    marginBottom: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#BBBBBB',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#709775',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#2C2C2C',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#709775',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
  },

  // Next Achievement Section
  nextSection: {
    marginBottom: 24,
  },
  nextSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  nextCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  nextBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginRight: 16,
  },
  nextBadgeInfo: {
    flex: 1,
  },
  nextName: {
    fontWeight: '700',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  nextTier: {
    fontSize: 13,
    color: '#709775',
    fontWeight: '600',
  },
  targetContainer: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  targetLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
    textAlign: 'center',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  targetNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#709775',
    marginRight: 6,
  },
  targetText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  motivationText: {
    fontSize: 14,
    color: '#BBBBBB',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Max Tier Section
  maxTierSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3C3C3C',
  },
  maxTierTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  maxTierSubtitle: {
    fontSize: 15,
    color: '#BBBBBB',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  maxTierText: {
    fontSize: 14,
    color: '#BBBBBB',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AchievementDetailScreen;