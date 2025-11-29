import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
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
  const [unlockedBadges, setUnlockedBadges] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentBadge && user) {
      fetchStatsAndNextBadge();
    } else {
      setLoading(false);
    }
  }, [currentBadge, user]);

  const fetchStatsAndNextBadge = async () => {
    try {
      setLoading(true);

      // Fetch user stats - handle case where document doesn't exist
      const statsDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('total')
        .doc('stats')
        .get();

      // Always set stats, even if document doesn't exist
      const statsData = statsDoc.exists
        ? statsDoc.data()
        : {
            educationalMaterialsRead: 0,
            weeklyQuizFinished: 0,
            taskFinished: 0,
          };
      setStats(statsData);

      // Get unlocked badges
      const unlocked = await badgesRepository.getUnlockedBadgesForUser(user.uid);
      setUnlockedBadges(unlocked);

      // For New User category, don't fetch next badge
      if (currentBadge.category.toLowerCase() === 'new user') {
        setNextBadge(null);
        setLoading(false);
        return;
      }

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
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Show loading while fetching data
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#415D43" />
      </View>
    );
  }

  // Handle case where currentBadge is missing
  if (!currentBadge) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <HeaderRow 
            title="Badge Not Found" 
            onBackPress={handleBackPress} 
          />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Badge information not available.</Text>
        </View>
      </View>
    );
  }

  // Always ensure stats exists with default values
  const safeStats = stats || {
    educationalMaterialsRead: 0,
    weeklyQuizFinished: 0,
    taskFinished: 0,
  };

  const isNewUserBadge = currentBadge.category.toLowerCase() === 'new user';

  // For New User badges, we don't need progress calculations
  if (isNewUserBadge) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <HeaderRow 
            title={currentBadge.name} 
            onBackPress={handleBackPress} 
          />
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Simplified Current Achievement Card for New User */}
          <View style={styles.currentCard}>
            <Image source={{ uri: currentBadge.imageurl }} style={styles.image} />
            <Text style={styles.title}>{currentBadge.name}</Text>
            
            {/* No category tag for New User */}
            
            <Text style={styles.description}>{currentBadge.description}</Text>
            
            {/* Special message for New User badge */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome to TerraTrack!</Text>
              <Text style={styles.welcomeMessage}>
                You've taken your first step towards making a positive environmental impact. 
                This badge marks the beginning of your sustainability journey.
              </Text>
            </View>

            <View style={styles.unlockedContainer}>
              <Text style={styles.unlockedText}>Achievement Unlocked</Text>
              <Text style={styles.unlockedSubtext}>
                This badge was awarded when you joined our community
              </Text>
            </View>
          </View>

          {/* No next tier section for New User */}
        </ScrollView>
      </View>
    );
  }

  // Regular badges (existing logic)
  const userValue =
    currentBadge.category.toLowerCase() === 'tasks'
      ? safeStats.taskFinished
      : currentBadge.category.toLowerCase() === 'weekly quiz'
      ? safeStats.weeklyQuizFinished
      : currentBadge.category.toLowerCase() === 'educational materials'
      ? safeStats.educationalMaterialsRead
      : 0;

  const isCurrentBadgeClaimed = unlockedBadges[currentBadge.id];
  
  // FIX: Don't show surplus - cap at targetNumber for claimed badges
  const displayValue = isCurrentBadgeClaimed ? currentBadge.targetNumber : Math.min(userValue, currentBadge.targetNumber);
  const progress = Math.min(displayValue / currentBadge.targetNumber, 1);
  const progressText = `${displayValue}/${currentBadge.targetNumber}`;
  const progressPercentage = Math.round(progress * 100);

  // FIX: Calculate remaining for next badge properly
  let remainingForNext = 0;
  let nextBadgeDisplayValue = userValue;
  
  if (nextBadge) {
    const isNextBadgeClaimed = unlockedBadges[nextBadge.id];
    
    if (isNextBadgeClaimed) {
      // If next badge is already claimed, show it as completed
      nextBadgeDisplayValue = nextBadge.targetNumber;
      remainingForNext = 0;
    } else {
      // If next badge is not claimed, calculate remaining properly
      nextBadgeDisplayValue = Math.min(userValue, nextBadge.targetNumber);
      remainingForNext = Math.max(nextBadge.targetNumber - userValue, 0);
    }
  }

  const nextProgress = nextBadge ? Math.min(nextBadgeDisplayValue / nextBadge.targetNumber, 1) : 0;
  const nextProgressText = nextBadge ? `${nextBadgeDisplayValue}/${nextBadge.targetNumber}` : '';

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
              
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress to Next Tier</Text>
                  <Text style={styles.progressPercentage}>{Math.round(nextProgress * 100)}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${nextProgress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{nextProgressText}</Text>
              </View>
              
              <Text style={styles.motivationText}>
                {remainingForNext > 0 
                  ? `${remainingForNext} more to go. You're making great progress toward your next achievement.`
                  : 'You have completed this tier! Claim your badge to continue.'}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
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

  // New User specific styles - simplified
  welcomeSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    // Removed the green border on the side
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 14,
    color: '#BBBBBB',
    lineHeight: 20,
    textAlign: 'center',
  },
  unlockedContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#709775',
    marginBottom: 4,
  },
  unlockedSubtext: {
    fontSize: 14,
    color: '#BBBBBB',
    textAlign: 'center',
  },

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
  motivationText: {
    fontSize: 14,
    color: '#BBBBBB',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 12,
  },

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