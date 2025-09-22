import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  UIManager,
  Modal,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { vScale, scale } from '../utils/scaling';

// Repositories
import {
  getCommunityProgress,
  getCommunityLeaderboard,
  getUpcomingQuarters,
  deleteCommunityProgress,
} from '../repositories/communityProgressRepository';

// Components
import HeaderRow from '../components/HeaderRow';
import QuarterCard from '../components/QuarterCard';
import RewardsCard from '../components/RewardsCard';
import RankedAvatar from '../components/RankedAvatar';

// Assets
import Crown from '../assets/images/Crown.png';

const { width, height } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AdminCommunityProgress = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [progressData, setProgressData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upcomingQuarters, setUpcomingQuarters] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [showQuarterModal, setShowQuarterModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progress, topUsers, upcoming] = await Promise.all([
        getCommunityProgress(),
        getCommunityLeaderboard(),
        getUpcomingQuarters(),
      ]);

      setProgressData(progress);
      setLeaderboard(topUsers || []);
      setUpcomingQuarters(upcoming || []);
    } catch (error) {
      console.error('Failed to load community progress:', error);
      Alert.alert('Error', 'Failed to load community progress data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuarter = (quarter) => {
    navigation.navigate('AddCommunityProgress', {
      quarterData: quarter,
      onSaved: () => {
        setLoading(true);
        loadData();
        setShowQuarterModal(false);
      },
    });
  };

  const handleDeleteQuarter = async (quarterId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this quarter?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommunityProgress(quarterId);
              setLoading(true);
              loadData();
              setShowQuarterModal(false);
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete quarter');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const openQuarterDetails = (quarter) => {
    setSelectedQuarter(quarter);
    setShowQuarterModal(true);
  };

  const renderCurrentProgress = () => {
    if (!progressData) {
      return (
        <View style={styles.centeredSection}>
          <Text style={styles.emptyText}>No current progress data available</Text>
        </View>
      );
    }

    const { description, current, goal, rewards, image, endDate } = progressData;
    const daysLeft = endDate ? Math.max(Math.floor((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)), 0) : 0;
    const progressPercentage = goal > 0 ? (current / goal) * 100 : 0;

    return (
      <View style={styles.section}>
        {image && (
          <Image 
            source={{ uri: image }} 
            style={styles.image}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.infoCard}>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.timeLeft}>Time remaining: {daysLeft} day{daysLeft !== 1 ? 's' : ''}</Text>

          <View style={styles.progressBox}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressHeader}>Progress</Text>
              <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
            </View>
            <Text style={styles.progressTitle}>
              {current} / {goal} tasks completed
            </Text>
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.customProgressFill, { width: `${Math.min(progressPercentage, 100)}%` }]} />
              </View>
            </View>
          </View>

          {rewards && <RewardsCard rewards={rewards} />}
        </View>
      </View>
    );
  };

  const renderUpcomingQuarters = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Quarters</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddCommunityProgress', { onSaved: loadData })}
          >
            <Text style={styles.addButtonText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {upcomingQuarters.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming quarters scheduled</Text>
        ) : (
          upcomingQuarters.map((quarter) => (
            <QuarterCard
              key={quarter.id}
              quarter={quarter}
              onPress={() => openQuarterDetails(quarter)}
            />
          ))
        )}
      </View>
    );
  };

  const renderLeaderboard = () => {
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3, 10);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Contributors</Text>
        
        {top3.length > 0 && (
          <View style={styles.podium}>
            {top3[1] && (
              <View style={[styles.podiumItem, styles.secondPlace]}>
                <RankedAvatar user={top3[1]} rank={2} />
              </View>
            )}
            {top3[0] && (
              <View style={[styles.podiumItem, styles.firstPlace]}>
                <Image source={Crown} style={styles.crown} />
                <RankedAvatar user={top3[0]} rank={1} />
              </View>
            )}
            {top3[2] && (
              <View style={[styles.podiumItem, styles.thirdPlace]}>
                <RankedAvatar user={top3[2]} rank={3} />
              </View>
            )}
          </View>
        )}

        {rest.length > 0 && (
          <View style={styles.leaderboardList}>
            {rest.map((item, index) => (
              <View key={item.id} style={styles.leaderboardItem}>
                <Text style={styles.rankBadge}>{index + 4}</Text>
                <Image 
                  source={require('../assets/images/Avatar.png')} 
                  style={styles.avatarSmall} 
                />
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.points}>{item.terraPoints} pts</Text>
              </View>
            ))}
          </View>
        )}

        {leaderboard.length === 0 && (
          <Text style={styles.emptyText}>No leaderboard data available</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#415D43" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderRow
          title="Community Progress"
          onBackPress={() => navigation.goBack()}
        />
      </View>

      <View style={styles.tabContainer}>
        {['current', 'upcoming', 'leaderboard'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'current' && renderCurrentProgress()}
        {activeTab === 'upcoming' && renderUpcomingQuarters()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
      </ScrollView>

      <QuarterDetailsModal
        visible={showQuarterModal}
        quarter={selectedQuarter}
        onEdit={handleEditQuarter}
        onDelete={handleDeleteQuarter}
        onClose={() => setShowQuarterModal(false)}
      />
    </View>
  );
};

const QuarterDetailsModal = ({ visible, quarter, onEdit, onDelete, onClose }) => {
  if (!quarter) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{quarter.id}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalDescription}>{quarter.description}</Text>
            
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalLabel}>Goal:</Text>
              <Text style={styles.modalValue}>{quarter.goal} tasks</Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Text style={styles.modalLabel}>Duration:</Text>
              <Text style={styles.modalValue}>
                {new Date(quarter.startDate).toLocaleDateString()} - {new Date(quarter.endDate).toLocaleDateString()}
              </Text>
            </View>

            {quarter.rewards && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Rewards</Text>
                <RewardsCard rewards={quarter.rewards} />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.editButton]} 
                onPress={() => onEdit(quarter)}
              >
                <Text style={styles.modalButtonText}>Edit Quarter</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]} 
                onPress={() => onDelete(quarter.id)}
              >
                <Text style={styles.modalButtonText}>Delete Quarter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  headerContainer: {
    paddingHorizontal: scale(16),
    paddingTop: scale(20),
    paddingBottom: scale(10),
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scrollContent: { 
    paddingBottom: scale(30),
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    marginBottom: scale(16),
    marginTop: scale(8),
    padding: scale(2),
  },
  tab: {
    flex: 1,
    padding: scale(12),
    alignItems: 'center',
    borderRadius: scale(10),
    justifyContent: 'center',
  },
  activeTab: { 
    backgroundColor: '#709775' 
  },
  tabText: { 
    color: '#CCCCCC', 
    fontWeight: '600', 
    fontSize: scale(12),
    textAlign: 'center',
  },
  activeTabText: { 
    color: '#fff' 
  },

  // Sections
  section: { 
    padding: scale(16) 
  },
  centeredSection: { 
    padding: scale(16), 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  sectionTitle: { 
    fontSize: scale(18), 
    color: '#709775', 
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Cards
  infoCard: { 
    backgroundColor: '#1E1E1E', 
    borderRadius: scale(12), 
    padding: scale(20), 
    marginBottom: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  progressBox: { 
    marginBottom: scale(20) 
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  progressHeader: { 
    fontWeight: 'bold', 
    fontSize: scale(16), 
    color: '#CCCCCC',
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontWeight: 'bold',
    fontSize: scale(14),
    color: '#709775',
  },
  progressTitle: { 
    fontWeight: '600', 
    fontSize: scale(14), 
    marginBottom: scale(12), 
    color: '#CCCCCC',
    textAlign: 'center',
  },
  progressBarWrapper: {
    alignItems: 'center',
    marginTop: scale(10),
  },
  progressBarContainer: {
    width: '100%',
    height: scale(12),
    backgroundColor: '#333',
    borderRadius: scale(6),
    overflow: 'hidden',
  },
  customProgressFill: {
    height: '100%',
    backgroundColor: '#415D43',
    borderRadius: scale(6),
  },
  description: { 
    color: '#CCCCCC', 
    fontSize: scale(14), 
    marginBottom: scale(12), 
    lineHeight: scale(20),
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  timeLeft: { 
    color: '#CCCCCC', 
    fontSize: scale(12), 
    marginBottom: scale(16), 
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // Image
  image: { 
    width: '100%', 
    height: scale(200), 
    borderRadius: scale(12), 
    marginBottom: scale(16),
  },

  // Buttons
  addButton: {
    backgroundColor: '#709775',
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderRadius: scale(12),
    minWidth: scale(80),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: scale(12),
    letterSpacing: 0.3,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: scale(16),
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: { 
    fontSize: scale(18), 
    color: '#709775', 
    fontWeight: 'bold',
    letterSpacing: 0.5,
    flex: 1,
  },
  closeButtonContainer: {
    padding: scale(4),
  },
  closeButton: { 
    color: '#CCCCCC', 
    fontSize: scale(20), 
    fontWeight: 'bold',
  },
  modalBody: { 
    padding: scale(20),
    maxHeight: height * 0.8,
  },
  modalSection: { 
    marginTop: scale(16) 
  },
  modalSectionTitle: { 
    color: '#709775', 
    fontWeight: 'bold', 
    marginBottom: scale(12),
    fontSize: scale(16),
    letterSpacing: 0.5,
  },
  modalInfoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: scale(12),
    alignItems: 'center',
  },
  modalLabel: { 
    color: '#CCCCCC', 
    fontWeight: '600',
    fontSize: scale(14),
  },
  modalValue: { 
    color: '#CCCCCC',
    fontSize: scale(14),
  },
  modalDescription: { 
    color: '#CCCCCC', 
    marginBottom: scale(16), 
    lineHeight: scale(20),
    fontSize: scale(14),
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  modalActions: { 
    padding: scale(20),
    borderTopWidth: 1,
    borderTopColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  modalButton: { 
    padding: scale(16), 
    borderRadius: scale(12), 
    alignItems: 'center',
    flex: 1,
    minHeight: scale(50),
    justifyContent: 'center',
  },
  editButton: { 
    backgroundColor: '#709775' 
  },
  deleteButton: { 
    backgroundColor: '#CC3A3A' 
  },
  modalButtonText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: scale(14),
    letterSpacing: 0.5,
  },

  // Leaderboard
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: scale(20),
    paddingHorizontal: scale(10),
  },
  podiumItem: { 
    alignItems: 'center',
    flex: 1,
  },
  firstPlace: { 
    marginBottom: scale(20) 
  },
  secondPlace: { 
    marginTop: scale(30) 
  },
  thirdPlace: { 
    marginTop: scale(30) 
  },
  crown: { 
    width: scale(35), 
    height: scale(35), 
    resizeMode: 'contain', 
    position: 'absolute', 
    top: scale(-5), 
    zIndex: 2 
  },

  leaderboardList: {
    backgroundColor: '#111D13',
    borderRadius: scale(12),
    padding: scale(16),
    marginTop: scale(10),
  },
  leaderboardItem: {
    flexDirection: 'row',
    backgroundColor: '#D9D9D9',
    borderRadius: scale(8),
    padding: scale(12),
    marginVertical: scale(6),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rankBadge: {
    fontWeight: 'bold',
    color: '#131313',
    backgroundColor: '#D9D9D9',
    borderRadius: scale(8),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    marginRight: scale(12),
    minWidth: scale(30),
    textAlign: 'center',
    fontSize: scale(12),
  },
  avatarSmall: { 
    width: scale(40), 
    height: scale(40), 
    resizeMode: 'contain', 
    marginRight: scale(12),
    borderRadius: scale(20),
  },
  username: { 
    fontWeight: 'bold', 
    flex: 1, 
    color: '#131313',
    fontSize: scale(14),
  },
  points: { 
    fontWeight: 'bold', 
    color: '#131313', 
    fontSize: scale(12),
  },

  // Empty states
  emptyText: { 
    color: '#888', 
    textAlign: 'center', 
    marginTop: scale(20), 
    fontStyle: 'italic',
    fontSize: scale(14),
    letterSpacing: 0.3,
  },
});

export default AdminCommunityProgress;