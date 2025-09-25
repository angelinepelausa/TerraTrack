import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ScrollView, 
  ActivityIndicator, Dimensions 
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

import { useBadges } from '../hooks/useBadges';
import { useChartData } from '../hooks/useChartData';
import { useLeaderboardStats } from '../hooks/useLeaderboardStats';
import { useUserProfile } from '../hooks/useUserProfile';

import { ChartSection } from '../components/ChartSection';
import { BadgesSection } from '../components/BadgesSection';
import HeaderRow from '../components/HeaderRow';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = width * 0.25;
const categories = ['Total', 'Diet', 'Transport', 'Energy'];

const PublicProfileScreen = ({ route, navigation }) => {
  const { userId: publicUserId } = route.params;
  const [dropdownOpen, setDropdownOpen] = useState({ year: false, category: false });
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedCategory, setSelectedCategory] = useState('Total');

  const { userData, currentAvatarUrl } = useUserProfile(publicUserId);

  const { unlockedBadges, displayedBadges } = useBadges(publicUserId);
  
  const { chartData, chartLoading } = useChartData(
    publicUserId,
    selectedYear,
    selectedCategory,
    userData
  );

  const {
    historyLoading,
    historyTotalResults,
    bestRank,
    bestRankDate,
    bestRankStreak
  } = useLeaderboardStats(publicUserId);

  useEffect(() => {
    if (publicUserId) {
      fetchAvailableYears(publicUserId);
    }
  }, [publicUserId]);

  const fetchAvailableYears = async (uid) => {
    try {
      const footprintsSnap = await firestore()
        .collection('users')
        .doc(uid)
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
      console.error('Error fetching years:', err);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header inside its own container with matching padding */}
      <View style={styles.headerContainer}>
        <HeaderRow
          title="User Profile"
          showBack
          onBackPress={() => navigation.goBack()}
        />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {currentAvatarUrl ? (
          <Image source={{ uri: currentAvatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>No Avatar</Text>
          </View>
        )}

        <Text style={styles.username}>{userData?.username || 'User'}</Text>

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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#131313',
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 10,
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
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: 5,
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

export default PublicProfileScreen;
