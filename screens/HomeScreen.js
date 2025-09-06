import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { getCommunityProgress } from '../repositories/communityProgressRepository';
import { getUserTerraCoins } from '../repositories/userRepository';
import { hasAttemptedQuiz } from '../repositories/quizAttemptsRepository';
import ProgressBar from '../components/ProgressBar';
import { scale, vScale } from '../utils/scaling';
import { useAuth } from '../context/AuthContext';

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

  const handleCardPress = (item) => {
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
    }
    else if (item.title === 'Weekly Quiz') {
      navigation.navigate('WeeklyQuizScreen');
    }
    else if (item.title === 'Invite') {
      navigation.navigate('InviteScreen');
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

  useEffect(() => {
    if (user) {
      fetchTerraCoins();
    }
  }, [user]);

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
              style={[
                styles.card,
                item.attempted && {backgroundColor: '#a7a7a7'}
              ]}
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

        <TouchableOpacity style={styles.shopBox}
        onPress={() => navigation.navigate('ShopScreen')}>
          <Text style={styles.shopText}>
            Buy exclusive avatars and rewards from{'\n'}our partners from the Terra Shop!
          </Text>
          <Image source={require('../assets/images/TerraShop.png')} style={styles.shopImage} />
        </TouchableOpacity>

        {communityProgress && (
          <TouchableOpacity
            style={styles.communityBox}
            onPress={() => navigation.navigate('CommunityProgressScreen')}
          >
            <Text style={styles.communityHeader}>Community Progress</Text>
            <Text style={styles.communityTitle}>
              Finish {communityProgress.goal} tasks
            </Text>
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
  communityTask: { fontSize: scale(12), color: '#131313' },

  bottomNav: {
    height: vScale(50),
    backgroundColor: '#415D43',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { color: '#DDDDDD', fontSize: scale(12) },
  navTextActive: { fontWeight: 'bold' },
  activeUnderline: {
    height: vScale(2),
    backgroundColor: '#DDDDDD',
    marginTop: vScale(2),
    width: '100%',
  },
});

export default HomeScreen;