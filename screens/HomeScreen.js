import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { getCommunityProgress } from '../repositories/communityProgressRepository';
import { getUserTerraCoins } from '../repositories/userRepository';
import ProgressBar from '../components/ProgressBar';
import { scale, vScale } from '../utils/scaling';

const { width } = Dimensions.get('window');
const PADDING = scale(20);
const GAP = scale(20);
const CARD_WIDTH = (width - PADDING * 2 - GAP) / 2;

const HomeScreen = ({ navigation }) => {
  const [terraCoins, setTerraCoins] = useState(0);
  const [communityProgress, setCommunityProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      title: 'Weekly Quiz',
      subtitle: 'Answer the weekly quiz to earn Terra Points and Coins!',
      image: require('../assets/images/WeeklyQuiz.png'),
    },
    {
      title: 'Achievements',
      subtitle: 'Accomplish achievements to earn Terra Points and Coins!',
      image: require('../assets/images/Achievements.png'),
    },
    {
      title: 'Read',
      subtitle: 'Read and answer the quiz to earn Terra Points and Coins!',
      image: require('../assets/images/Read.png'),
    },
    {
      title: 'Invite',
      subtitle: 'Invite friends to TerraTrack to earn Terra Coins and Points!',
      image: require('../assets/images/Invite.png'),
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
              style={styles.card}
              onPress={() => {
                if (item.title === 'Read') {
                  navigation.navigate('EducationalScreen');
                }
              }}
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

        <TouchableOpacity style={styles.shopBox}>
          <Text style={styles.shopText}>
            Buy exclusive avatars and rewards from{'\n'}our partners from the Terra Shop!
          </Text>
          <Image source={require('../assets/images/TerraShop.png')} style={styles.shopImage} />
        </TouchableOpacity>

        {communityProgress && (
          <View style={styles.communityBox}>
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
          </View>
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
