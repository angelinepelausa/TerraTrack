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
import Icon from 'react-native-vector-icons/Ionicons';

// Repositories
import {
  getCommunityProgress,
  getCommunityLeaderboard,
  getUpcomingQuarters,
  deleteCommunityProgress,
} from '../repositories/communityProgressRepository';
import { populateUserData } from '../repositories/userRepository'; // Import the helper function

// Components
import HeaderRow from '../components/HeaderRow';
import RankedAvatar from '../components/RankedAvatar';

// Icons
import Crown from '../assets/images/Crown.png';
import TerraCoin from '../assets/images/TerraCoin.png';
import TerraPoint from '../assets/images/TerraPoint.png';

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
  const [showRewardsDropdown, setShowRewardsDropdown] = useState(false);

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

    const { title, description, current, goal, rewards, image, endDate } = progressData;
    const daysLeft = endDate ? Math.max(Math.floor((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)), 0) : 0;
    const progressPercentage = goal > 0 ? (current / goal) * 100 : 0;

    return (
      <View style={styles.section}>
        {image && (
          <Image 
            source={{ uri: image }} 
            style={styles.image}
            resizeMode="contain"
          />
        )}
        
        <View style={styles.infoCard}>
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}
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

          {/* Simplified Rewards Dropdown with Images */}
          {rewards && (
            <View style={styles.rewardsDropdownContainer}>
              <TouchableOpacity 
                style={styles.rewardsDropdownHeader}
                onPress={() => setShowRewardsDropdown(!showRewardsDropdown)}
              >
                <Text style={styles.rewardsDropdownTitle}>Rewards</Text>
                <Icon 
                  name={showRewardsDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#709775" 
                />
              </TouchableOpacity>
              
              {showRewardsDropdown && (
                <View style={styles.rewardsDropdownContent}>
                  {[
                    { label: "Top 1", reward: rewards.top1 },
                    { label: "Top 2", reward: rewards.top2 },
                    { label: "Top 3", reward: rewards.top3 },
                    { label: "Top 4-10", reward: rewards.top4to10 },
                    { label: "Top 11+", reward: rewards.top11plus },
                  ].map((item, index) => (
                    <View key={item.label} style={styles.rewardItem}>
                      <Text style={styles.rewardLabel}>{item.label}</Text>
                      <View style={styles.rewardValues}>
                        <View style={styles.rewardValue}>
                          <Image source={TerraPoint} style={styles.rewardIcon} />
                          <Text style={styles.rewardText}>{item.reward.terraPoints}</Text>
                        </View>
                        <View style={styles.rewardValue}>
                          <Image source={TerraCoin} style={styles.rewardIcon} />
                          <Text style={styles.rewardText}>{item.reward.terraCoins}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderUpcomingQuarters = () => {
    return (
      <View style={styles.upcomingSection}>
        {/* Removed the header with "Upcoming Quarters" text */}
        
        {upcomingQuarters.length === 0 ? (
          <View style={styles.emptyUpcoming}>
            <Text style={styles.emptyText}>No upcoming quarters scheduled</Text>
          </View>
        ) : (
          <View style={styles.upcomingGrid}>
            {upcomingQuarters.map((quarter) => (
              <TouchableOpacity
                key={quarter.id}
                style={styles.quarterCard}
                onPress={() => openQuarterDetails(quarter)}
              >
                {quarter.image && (
                  <Image 
                    source={{ uri: quarter.image }} 
                    style={styles.quarterImage}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.quarterContent}>
                  <View style={styles.quarterHeader}>
                    <Text style={styles.quarterId}>{quarter.id}</Text>
                    <Icon name="chevron-forward" size={18} color="#709775" />
                  </View>
                  {quarter.title && (
                    <Text style={styles.quarterTitle} numberOfLines={1}>
                      {quarter.title}
                    </Text>
                  )}
                  {quarter.description && (
                    <Text style={styles.quarterDescription} numberOfLines={2}>
                      {quarter.description}
                    </Text>
                  )}
                  <View style={styles.quarterStats}>
                    <View style={styles.statItem}>
                      <Icon name="flag" size={14} color="#709775" style={styles.statIcon} />
                      <Text style={styles.quarterStat}>
                        {quarter.goal} tasks
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Icon name="calendar" size={14} color="#709775" style={styles.statIcon} />
                      <Text style={styles.quarterStat}>
                        {quarter.startDate ? new Date(quarter.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderLeaderboard = () => {
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3, 10);

    return (
      <View style={styles.section}>
        
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
                {item.avatar ? (
                  <Image 
                    source={{ uri: item.avatar }} 
                    style={styles.avatarSmall} 
                  />
                ) : (
                  <Image 
                    source={require('../assets/images/Avatar.png')} 
                    style={styles.avatarSmall} 
                  />
                )}
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

      {/* Floating Add Button - Only visible on upcoming tab */}
      {activeTab === 'upcoming' && (
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => navigation.navigate('AddCommunityProgress', { onSaved: loadData })}
        >
          <Icon name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

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
  const [showRewards, setShowRewards] = useState(false);

  if (!quarter) return null;

  // Check if quarter is upcoming (start date is in the future)
  const isUpcoming = quarter.startDate ? new Date(quarter.startDate) > new Date() : false;
  const status = isUpcoming ? 'Inactive' : (quarter.processed ? 'Completed' : 'Active');

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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#CCCCCC" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalBodyContent}
          >
            {quarter.image && (
              <Image 
                source={{ uri: quarter.image }} 
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}

            {quarter.title && (
              <Text style={styles.modalTitleText}>{quarter.title}</Text>
            )}
            
            <Text style={styles.modalDescription}>{quarter.description}</Text>
            
            <View style={styles.modalInfoSection}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Goal:</Text>
                <Text style={styles.modalValue}>{quarter.goal} tasks</Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Start Date:</Text>
                <Text style={styles.modalValue}>
                  {quarter.startDate ? new Date(quarter.startDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Not set'}
                </Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>End Date:</Text>
                <Text style={styles.modalValue}>
                  {quarter.endDate ? new Date(quarter.endDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Not set'}
                </Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Current Progress:</Text>
                <Text style={styles.modalValue}>{quarter.current || 0} / {quarter.goal}</Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Status:</Text>
                <Text style={[
                  styles.modalValue,
                  status === 'Inactive' && styles.inactiveStatus,
                  status === 'Active' && styles.activeStatus,
                  status === 'Completed' && styles.completedStatus
                ]}>
                  {status}
                </Text>
              </View>
            </View>

            {/* Simplified Rewards Section in Modal matching Current Tab style */}
            {quarter.rewards && (
              <View style={styles.modalRewardsSection}>
                <TouchableOpacity 
                  style={styles.modalRewardsHeader}
                  onPress={() => setShowRewards(!showRewards)}
                >
                  <Text style={styles.modalSectionTitle}>Rewards</Text>
                  <Icon 
                    name={showRewards ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#709775" 
                  />
                </TouchableOpacity>
                
                {showRewards && (
                  <View style={styles.modalRewardsContent}>
                    {[
                      { label: "Top 1", reward: quarter.rewards.top1 },
                      { label: "Top 2", reward: quarter.rewards.top2 },
                      { label: "Top 3", reward: quarter.rewards.top3 },
                      { label: "Top 4-10", reward: quarter.rewards.top4to10 },
                      { label: "Top 11+", reward: quarter.rewards.top11plus },
                    ].map((item, index) => (
                      <View key={item.label} style={styles.modalRewardItem}>
                        <Text style={styles.modalRewardLabel}>{item.label}</Text>
                        <View style={styles.modalRewardValues}>
                          <View style={styles.modalRewardValue}>
                            <Image source={TerraPoint} style={styles.modalRewardIcon} />
                            <Text style={styles.modalRewardText}>{item.reward.terraPoints}</Text>
                          </View>
                          <View style={styles.modalRewardValue}>
                            <Image source={TerraCoin} style={styles.modalRewardIcon} />
                            <Text style={styles.modalRewardText}>{item.reward.terraCoins}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
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
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scrollContent: { 
    paddingBottom: scale(30),
  },

  // Floating Add Button
  floatingAddButton: {
    position: 'absolute',
    bottom: scale(30),
    right: scale(30),
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#709775',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 100,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    marginHorizontal: scale(16),
    borderRadius: scale(12),
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
  upcomingSection: {
    padding: scale(16),
  },
  centeredSection: { 
    padding: scale(16), 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  sectionTitle: { 
    fontSize: scale(18), 
    color: '#709775', 
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Title
  title: {
    fontSize: scale(20),
    color: '#709775',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: scale(12),
    letterSpacing: 0.5,
  },

  // Image Styles
  image: {
    width: '100%',
    height: scale(180),
    borderRadius: scale(12),
    marginBottom: scale(16),
    alignSelf: 'center',
  },

  // Modal Image Styles
  modalImage: {
    width: '100%',
    height: scale(200),
    borderRadius: scale(12),
    marginBottom: scale(16),
    alignSelf: 'center',
  },

  // Quarter Image
  quarterImage: {
    width: '100%',
    height: scale(140),
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

  // Status Styles
  inactiveStatus: {
    color: '#FFA500', // Orange for inactive
  },
  activeStatus: {
    color: '#4CAF50', // Green for active
  },
  completedStatus: {
    color: '#709775', // Teal for completed
  },

  // Simplified Rewards Dropdown with Images (USED IN BOTH CURRENT AND MODAL)
  rewardsDropdownContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: scale(12),
    overflow: 'hidden',
    marginTop: scale(16),
  },
  rewardsDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
  },
  rewardsDropdownTitle: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#709775',
  },
  rewardsDropdownContent: {
    padding: scale(16),
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  rewardLabel: {
    fontSize: scale(14),
    color: '#CCCCCC',
    fontWeight: '600',
    flex: 1,
  },
  rewardValues: {
    flexDirection: 'row',
    gap: scale(20),
    alignItems: 'center',
  },
  rewardValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    minWidth: scale(60),
  },
  rewardIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  rewardText: {
    fontSize: scale(14),
    color: '#fff',
    fontWeight: '600',
    minWidth: scale(30),
  },

  // Upcoming Quarters Grid
  upcomingGrid: {
    gap: scale(16),
  },
  quarterCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: scale(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  quarterContent: {
    padding: scale(16),
  },
  quarterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  quarterId: {
    fontSize: scale(16),
    fontWeight: 'bold',
    color: '#709775',
  },
  quarterTitle: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#fff',
    marginBottom: scale(8),
  },
  quarterDescription: {
    fontSize: scale(12),
    color: '#CCCCCC',
    marginBottom: scale(12),
    lineHeight: scale(16),
  },
  quarterStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  statIcon: {
    marginRight: scale(4),
  },
  quarterStat: {
    fontSize: scale(12),
    color: '#709775',
    fontWeight: '600',
  },

  // Buttons (old add button removed)
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#709775',
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(12),
    marginTop: scale(16),
    gap: scale(8),
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: scale(14),
    letterSpacing: 0.3,
  },
  emptyUpcoming: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(40),
  },

  // Modal - EXPANDED with smaller text
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    width: '100%',
    height: height * 0.85,
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
  modalTitleText: {
    fontSize: scale(18),
    color: '#709775',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: scale(12),
    letterSpacing: 0.5,
    paddingHorizontal: scale(16),
  },
  closeButton: {
    padding: scale(4),
  },
  modalBody: { 
    flex: 1,
  },
  modalBodyContent: {
    paddingBottom: scale(40),
  },
  modalInfoSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: scale(12),
    padding: scale(16),
    margin: scale(16),
    marginTop: scale(8),
    gap: scale(12),
  },
  
  // Modal Rewards Section - NOW MATCHES CURRENT TAB STYLE
  modalRewardsSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: scale(12),
    margin: scale(16),
    marginTop: scale(8),
    overflow: 'hidden',
  },
  modalRewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(16),
  },
  modalSectionTitle: { 
    color: '#709775', 
    fontWeight: 'bold', 
    fontSize: scale(16),
    letterSpacing: 0.5,
  },
  modalRewardsContent: {
    padding: scale(16),
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  modalRewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalRewardLabel: {
    fontSize: scale(14),
    color: '#CCCCCC',
    fontWeight: '600',
    flex: 1,
  },
  modalRewardValues: {
    flexDirection: 'row',
    gap: scale(20),
    alignItems: 'center',
  },
  modalRewardValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    minWidth: scale(60),
  },
  modalRewardIcon: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
  modalRewardText: {
    fontSize: scale(14),
    color: '#fff',
    fontWeight: '600',
    minWidth: scale(30),
  },
  
  modalInfoRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalLabel: { 
    color: '#CCCCCC', 
    fontWeight: '600',
    fontSize: scale(14),
  },
  modalValue: { 
    color: '#fff',
    fontSize: scale(14),
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    paddingLeft: scale(10),
  },
  modalDescription: { 
    color: '#CCCCCC', 
    marginBottom: scale(16), 
    lineHeight: scale(20),
    fontSize: scale(14),
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: scale(16),
  },
  modalActions: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
    marginTop: scale(24),
    marginBottom: scale(16),
    paddingHorizontal: scale(16),
  },
  modalButton: { 
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(16), 
    borderRadius: scale(12), 
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