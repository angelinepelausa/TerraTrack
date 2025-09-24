import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, 
  ActivityIndicator, Dimensions, Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

import { useProfile } from '../hooks/useProfile';
import { useBadges } from '../hooks/useBadges';
import { useChartData } from '../hooks/useChartData';
import { useLeaderboardStats } from '../hooks/useLeaderboardStats';
import { ChartSection } from '../components/ChartSection';
import { BadgesSection } from '../components/BadgesSection';
import AvatarPicker from '../components/AvatarPicker';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = width * 0.25;
const categories = ['Total', 'Diet', 'Transport', 'Energy'];

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [dropdownOpen, setDropdownOpen] = useState({ year: false, category: false });
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedCategory, setSelectedCategory] = useState('Total');
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const { userData, currentAvatarUrl, userId, setUserData } = useProfile();
  const {
    unlockedBadges,
    displayedBadges,
    badgeEditMode,
    tempDisplayedBadges,
    enterBadgeEditMode,
    cancelBadgeEdit,
    saveDisplayedBadges,
    toggleBadgeSelection
  } = useBadges(userId);
  
  const { chartData, chartLoading } = useChartData(userId, selectedYear, selectedCategory, userData);
  const {
    historyLoading,
    historyTotalResults,
    bestRank,
    bestRankDate,
    bestRankStreak
  } = useLeaderboardStats(userId);

  useEffect(() => {
    if (userId) {
      fetchUserProfileData();
    }
  }, [userId]);

  const fetchUserProfileData = async () => {
    try {
      const profileDoc = await firestore().collection('users').doc(userId).get();
      if (!profileDoc.exists) return;

      const profileData = profileDoc.data();
      setUserData(profileData);

      const footprintsSnap = await firestore()
        .collection('users')
        .doc(userId)
        .collection('footprints')
        .get();

      if (!footprintsSnap.empty) {
        const availableYears = [
          ...new Set(footprintsSnap.docs.map(doc => doc.id.split('-')[0]))
        ].sort().reverse();
        setYears(availableYears);

        if (!availableYears.includes(selectedYear)) {
          setSelectedYear(availableYears[0]);
        }
      } else {
        setYears([selectedYear]);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    }
  };

  const handleAvatarSelect = async (avatar) => {
    try {
      await firestore().collection('users').doc(userId).update({ avatar: avatar.id });
      setAvatarModalVisible(false);
    } catch (err) {
      console.error('Error updating avatar:', err);
      Alert.alert('Error', 'Failed to update avatar');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => navigation.navigate('SettingsScreen')}
      >
        <Image source={require('../assets/icons/edit.png')} style={styles.editIcon} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setAvatarModalVisible(true)}>
        {currentAvatarUrl ? (
          <Image source={{ uri: currentAvatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>No Avatar</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.username}>{userData?.username || 'User'}</Text>

      {userData?.avatar && (
        <AvatarPicker
          visible={avatarModalVisible}
          onClose={() => setAvatarModalVisible(false)}
          onSelect={handleAvatarSelect}
        />
      )}

      <ChartSection
        chartData={chartData}
        chartLoading={chartLoading}
        selectedYear={selectedYear}
        selectedCategory={selectedCategory}
        years={years}
        categories={categories}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        setSelectedYear={setSelectedYear}
        setSelectedCategory={setSelectedCategory}
      />

      <BadgesSection
        unlockedBadges={unlockedBadges}
        displayedBadges={displayedBadges}
        badgeEditMode={badgeEditMode}
        tempDisplayedBadges={tempDisplayedBadges}
        enterBadgeEditMode={enterBadgeEditMode}
        cancelBadgeEdit={cancelBadgeEdit}
        saveDisplayedBadges={saveDisplayedBadges}
        toggleBadgeSelection={toggleBadgeSelection}
        navigation={navigation}
        userId={userId}
      />

      <View style={styles.statsRow}>
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Best Leaderboard Rank</Text>
          {historyLoading ? (
            <ActivityIndicator size="small" color="#709775" style={{ marginVertical: 8 }} />
          ) : historyTotalResults === 0 ? (
            <>
              <Text style={styles.statsValue}>—</Text>
              <Text style={styles.statsSub}>No results yet</Text>
            </>
          ) : (
            <>
              <Text style={styles.statsValue}>{bestRank != null ? `#${bestRank}` : '—'}</Text>
              <Text style={styles.statsSub}>{bestRankDate || 'Date not available'}</Text>
              {bestRankStreak > 1 && (
                <Text style={styles.statsStreak}>Achieved {bestRankStreak} times</Text>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#131313'
  },
  editButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 100,
  },
  editIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: 5,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  avatarPlaceholderText: {
    color: '#888',
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  statsTitle: {
    color: '#709775',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  statsValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsSub: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  statsStreak: {
    color: '#709775',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default ProfileScreen;