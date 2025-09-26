import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert, Modal } from 'react-native';
import { getCommunityProgress } from '../repositories/communityProgressRepository';
import { getUserTerraCoins } from '../repositories/userRepository';
import { hasAttemptedQuiz } from '../repositories/quizAttemptsRepository';
import ProgressBar from '../components/ProgressBar';
import { scale, vScale } from '../utils/scaling';
import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import SuspensionPopup from '../components/SuspensionPopup'; // NEW IMPORT

const { width } = Dimensions.get('window');
const PADDING = scale(20);
const GAP = scale(20);
const CARD_WIDTH = (width - PADDING * 2 - GAP) / 2;

// Function to get current week's Monday date (quiz starts on Monday)
const getCurrentQuizWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

const HomeScreen = ({ navigation }) => {
  const [terraCoins, setTerraCoins] = useState(0);
  const [communityProgress, setCommunityProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyQuizAttempted, setWeeklyQuizAttempted] = useState(false);
  const { user } = useAuth();

  // new states for monthly footprint popup
  const [showPopup, setShowPopup] = useState(false);
  const [lastMonthResult, setLastMonthResult] = useState(null);

  // NEW STATES FOR SUSPENSION POPUP
  const [showSuspensionPopup, setShowSuspensionPopup] = useState(false);
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const progress = await getCommunityProgress();
        if (progress) {
          setCommunityProgress(progress);
        } else {
          setError('No community progress data found.');
        }

        // Check if weekly quiz is already attempted (using Monday as start)
        if (user) {
          const weekId = `weekly_${getCurrentQuizWeek()}`;
          const attempted = await hasAttemptedQuiz(weekId, 'weekly');
          setWeeklyQuizAttempted(attempted);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      fetchTerraCoins();
      checkMonthlyFootprint();
      checkSuspensionStatus(); // NEW FUNCTION CALL
    }
  }, [user?.uid]);

  const fetchTerraCoins = async () => {
    try {
      const result = await getUserTerraCoins(user.uid);
      if (result.success) {
        setTerraCoins(result.terraCoins);
      }
    } catch (error) {
      console.error('Error fetching TerraCoins:', error);
    }
  };

  // NEW FUNCTION: Check user suspension status
  const checkSuspensionStatus = async () => {
    try {
      const doc = await firestore().collection('users').doc(user.uid).get();
      if (doc.exists) {
        const userData = doc.data();
        setUserStatus(userData.status);
        
        // Show suspension popup if user is suspended, banned, or has a warning
        if (userData.status === 'suspended' || userData.status === 'banned' || userData.suspendedCount === 1) {
          setShowSuspensionPopup(true);
        }
      }
    } catch (error) {
      console.error('Error checking suspension status:', error);
    }
  };

  // 🔥 Monthly footprint check
  const checkMonthlyFootprint = async () => {
    try {
      console.log("👀 Running checkMonthlyFootprint for", user.uid);

      const now = new Date();
      const currentDay = now.getDate();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const currentMonthKey = `${year}-${month}`;

      const lastMonthDate = new Date(year, now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

      // Get current month footprint
      const currentDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('footprints')
        .doc(currentMonthKey)
        .get({ source: 'server' });

      // Check if current month is missing or empty
      const currentData = currentDoc.exists ? currentDoc.data() : null;
      const hasCurrentFootprint = currentData && currentData.results && Object.keys(currentData.results).length > 0;

      // Show popup if today is the 1st OR footprint is missing/empty
      if (currentDay === 1 || !hasCurrentFootprint) {
        console.log(`📌 Showing popup for ${currentMonthKey}`);

        const lastMonthDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('footprints')
          .doc(lastMonthKey)
          .get({ source: 'server' });

        if (lastMonthDoc.exists && lastMonthDoc.data().results) {
          console.log("📌 Found last month's result", lastMonthDoc.data());
          setLastMonthResult(lastMonthDoc.data().results);
        }

        setShowPopup(true);
      } else {
        console.log(`✅ Already has footprint for ${currentMonthKey} → no popup`);
      }
    } catch (error) {
      console.error('Error checking monthly footprint:', error);
    }
  };

  const handleCardPress = (item) => {
    // NEW: Block app interaction if user is suspended or banned
    if (userStatus === 'suspended' || userStatus === 'banned') {
      return;
    }

    if (item.attempted) {
      Alert.alert(
        'Quiz Completed',
        'You have already taken this week\'s quiz. Please check back next week for a new quiz!',
        [{ text: 'OK' }]
      );
      return;
    }

    if (item.title === 'Read') {
      navigation.navigate('EducationalScreen');
    } else if (item.title === 'Weekly Quiz') {
      navigation.navigate('WeeklyQuizScreen');
    } else if (item.title === 'Invite') {
      navigation.navigate('InviteScreen');
    } else if (item.title === 'Achievements') {
      navigation.navigate('AchievementsScreen');
    }
  };

  const features = [
    {
      title: 'Weekly Quiz',
      subtitle: weeklyQuizAttempted
        ? 'Quiz completed for this week!'
        : 'Answer the weekly quiz to earn Terra Points and Coins!',
      image: require('../assets/images/WeeklyQuiz.png'),
      attempted: weeklyQuizAttempted,
    },
    {
      title: 'Achievements',
      subtitle: 'Accomplish achievements to earn Terra Points and Coins!',
      image: require('../assets/images/Achievements.png'),
      attempted: false,
    },
    {
      title: 'Read',
      subtitle: 'Read and answer the quiz to earn Terra Points and Coins!',
      image: require('../assets/images/Read.png'),
      attempted: false,
    },
    {
      title: 'Invite',
      subtitle: 'Invite friends to TerraTrack to earn Terra Coins and Points!',
      image: require('../assets/images/Invite.png'),
      attempted: false,
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#415D43" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image source={require('../assets/images/TerraCoin.png')} style={styles.coinImage} />
          <Text style={styles.coinText}>{terraCoins}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.grid}>
          {features.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, item.attempted && { backgroundColor: '#a7a7a7' }]}
              onPress={() => handleCardPress(item)}
            >
              <View style={styles.cardTextArea}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <Image source={item.image} style={styles.cardImage} />
              <TouchableOpacity style={styles.earnButton}>
                <Text style={styles.earnText}>Earn</Text>
                <Image source={require('../assets/images/TerraCoin.png')} style={styles.earnCoin} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.shopBox} onPress={() => navigation.navigate('ShopScreen')}>
          <Text style={styles.shopText}>
            Buy exclusive avatars and rewards from our partners from the Terra Shop!
          </Text>
          <Image source={require('../assets/images/TerraShop.png')} style={styles.shopImage} />
        </TouchableOpacity>

        {communityProgress && (
          <TouchableOpacity
            style={styles.communityBox}
            onPress={() => navigation.navigate('CommunityProgressScreen')}
          >
            <Text style={styles.communityHeader}>Community Progress</Text>
            <Text style={styles.communityTitle}>Finish {communityProgress.goal} tasks</Text>
            <View style={{ marginTop: vScale(8), width: '90%' }}>
              <ProgressBar
                progress={
                  communityProgress.goal > 0
                    ? (communityProgress.current / communityProgress.goal) * 100
                    : 0
                }
              />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* 🔥 Monthly Carbon Footprint Popup */}
      <Modal visible={showPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>It's a New Month!</Text>
            <Text style={styles.modalSubtitle}>
              {lastMonthResult
                ? 'See how your footprint compares to last month.'
                : "Let's calculate your footprint to see where you stand."}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowPopup(false);

                // Normalize last month result
                const normalizedLastMonth = lastMonthResult
                  ? {
                      totalAnnual: lastMonthResult.totalAnnual || 0,
                      transportEmissionAnnual: lastMonthResult.transportEmissionAnnual || 0,
                      electricityEmissionAnnual: lastMonthResult.electricityEmissionAnnual || 0,
                      dietEmissionAnnual: lastMonthResult.dietEmissionAnnual || 0,
                    }
                  : null;

                navigation.navigate('Calculator', {
                  ...(normalizedLastMonth ? { compareWithLastMonth: normalizedLastMonth } : {}),
                });
              }}
            >
              <Text style={styles.modalButtonText}>Calculate Carbon Footprint</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* NEW: Suspension Popup */}
      <SuspensionPopup
        userId={user?.uid}
        visible={showSuspensionPopup}
        onClose={() => setShowSuspensionPopup(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  errorBanner: { backgroundColor: 'red', padding: 10, borderRadius: 5, marginBottom: 10 },
  errorText: { color: '#fff', textAlign: 'center' },

  topBar: {
    height: vScale(110),
    backgroundColor: '#415D43',
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: scale(10),
  },
  coinBox: {
    width: scale(80),
    height: vScale(32),
    backgroundColor: '#DDDDDD',
    borderRadius: scale(30),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinImage: { width: scale(20), height: scale(20), marginRight: scale(5), resizeMode: 'contain' },
  coinText: { color: '#131313', fontWeight: 'bold', fontSize: scale(12) },

  content: { flex: 1, padding: PADDING },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: scale(15),
    paddingHorizontal: scale(12),
    marginBottom: GAP,
    height: vScale(160),
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: vScale(75) },
  cardTitle: { color: '#131313', fontSize: scale(13), fontWeight: 'bold', textAlign: 'center' },
  cardSubtitle: { color: '#415D43', fontSize: scale(10), textAlign: 'center', marginTop: vScale(4) },
  cardImage: {
    width: scale(110),
    height: scale(110),
    resizeMode: 'contain',
    position: 'absolute',
    bottom: scale(0),
    left: scale(10),
  },
  earnButton: {
    flexDirection: 'row',
    backgroundColor: '#415D43',
    paddingHorizontal: scale(12),
    paddingVertical: vScale(6),
    borderRadius: scale(20),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    position: 'absolute',
    bottom: scale(10),
    right: scale(10),
  },
  earnText: { color: '#fff', fontSize: scale(11), marginRight: scale(5) },
  earnCoin: { width: scale(16), height: scale(16), resizeMode: 'contain' },

  shopBox: {
    height: vScale(90),
    backgroundColor: '#415D43',
    borderRadius: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(25),
    marginBottom: GAP,
  },
  shopText: { color: '#CCCCCC', fontSize: scale(13), flex: 1, marginRight: scale(5), fontWeight: 'bold' },
  shopImage: { width: scale(40), height: scale(40), resizeMode: 'contain' },

  communityBox: {
    height: vScale(140),
    backgroundColor: '#CCCCCC',
    borderRadius: scale(25),
    padding: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityHeader: {
    fontWeight: 'bold',
    fontSize: scale(20),
    marginBottom: vScale(8),
    color: '#131313',
  },
  communityTitle: { fontWeight: 'bold', fontSize: scale(15), marginBottom: vScale(4), color: '#415D43' },

  // 🔥 Popup styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: '#555', marginBottom: 20, textAlign: 'center' },
  modalButton: {
    backgroundColor: '#415D43',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  modalButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default HomeScreen;