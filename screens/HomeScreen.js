import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ActivityIndicator, 
  Alert,
  Modal
} from 'react-native';
import { getCommunityProgress } from '../repositories/communityProgressRepository';
import { getUserTerraCoins, addReferralRewards, shouldShowReferralRewards } from '../repositories/userRepository';
import { hasAttemptedQuiz } from '../repositories/quizAttemptsRepository';
import ProgressBar from '../components/ProgressBar';
import { scale, vScale } from '../utils/scaling';
import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import SuspensionPopup from '../components/SuspensionPopup';
import ConfirmationPopup from '../components/ConfirmationPopup';
import BadgePopup from '../components/BadgePopup';
import ReferralRewardPopup from '../components/ReferralRewardPopup';
import { badgesRepository } from '../repositories/badgesRepository';

const { width, height } = Dimensions.get('window');
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

// Walkthrough Component with precise positioning
const WalkthroughOverlay = ({ 
  visible, 
  currentStep, 
  onNext, 
  onSkip, 
  onComplete, 
  getStepInfo 
}) => {
  if (!visible) return null;

  const stepInfo = getStepInfo(currentStep);
  if (!stepInfo) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.walkthroughContainer}>
        {/* Light overlay for background */}
        <View style={styles.lightOverlay} />
        
        {/* Highlight mask with cutout */}
        <View style={styles.maskContainer}>
          {/* Top overlay */}
          {stepInfo.highlightStyle.top > 0 && (
            <View style={[styles.overlaySection, { 
              height: stepInfo.highlightStyle.top 
            }]} />
          )}
          
          {/* Middle section with highlight cutout */}
          <View style={styles.middleSection}>
            {/* Left overlay */}
            {stepInfo.highlightStyle.left > 0 && (
              <View style={[styles.overlaySection, { 
                width: stepInfo.highlightStyle.left 
              }]} />
            )}
            
            {/* Highlight area */}
            <View style={[
              styles.highlightArea,
              {
                width: stepInfo.highlightStyle.width,
                height: stepInfo.highlightStyle.height,
              }
            ]}>
              <View style={styles.highlightBorder} />
            </View>
            
            {/* Right overlay */}
            {stepInfo.highlightStyle.right !== undefined && (
              <View style={[styles.overlaySection, { 
                flex: 1 
              }]} />
            )}
          </View>
          
          {/* Bottom overlay */}
          {stepInfo.highlightStyle.bottom !== undefined && (
            <View style={[styles.overlaySection, { 
              flex: 1 
            }]} />
          )}
        </View>

        {/* Tooltip - Ensure it's always above the overlay */}
        <View style={[styles.tooltip, stepInfo.tooltipStyle]}>
          <Text style={styles.tooltipTitle}>{stepInfo.title}</Text>
          <Text style={styles.tooltipDescription}>{stepInfo.description}</Text>
          
          {/* Navigation Buttons - Ensure they're always clickable */}
          <View style={styles.walkthroughButtons}>
            {currentStep < 6 ? (
              <>
                <TouchableOpacity 
                  style={styles.skipButton} 
                  onPress={onSkip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.nextButton} 
                  onPress={onNext}
                  activeOpacity={0.7}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.completeButton} 
                onPress={onComplete}
                activeOpacity={0.7}
              >
                <Text style={styles.completeButtonText}>Get Started</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const HomeScreen = ({ navigation, route }) => {
  const [terraCoins, setTerraCoins] = useState(0);
  const [communityProgress, setCommunityProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyQuizAttempted, setWeeklyQuizAttempted] = useState(false);
  const { user } = useAuth();

  // Walkthrough states
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCheckedWalkthrough, setHasCheckedWalkthrough] = useState(false);

  // new states for monthly footprint popup
  const [showPopup, setShowPopup] = useState(false);
  const [lastMonthResult, setLastMonthResult] = useState(null);

  // NEW STATES FOR SUSPENSION POPUP
  const [showSuspensionPopup, setShowSuspensionPopup] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [userData, setUserData] = useState(null);

  // NEW STATE FOR WEEKLY QUIZ CONFIRMATION
  const [showQuizConfirmation, setShowQuizConfirmation] = useState(false);

  // BADGE POPUP STATES
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [welcomeBadge, setWelcomeBadge] = useState(null);
  const [hasCheckedBadge, setHasCheckedBadge] = useState(false);

  // NEW STATES FOR REFERRAL REWARDS
  const [showReferralRewards, setShowReferralRewards] = useState(false);
  const [isClaimingReferralRewards, setIsClaimingReferralRewards] = useState(false);
  const [hasCheckedReferralRewards, setHasCheckedReferralRewards] = useState(false);
  const [showClaimSuccessPopup, setShowClaimSuccessPopup] = useState(false); // NEW STATE

  // Check if user has seen walkthrough before - UPDATED LOGIC
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        if (user?.uid && !hasCheckedWalkthrough) {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          const userData = userDoc.data();
          
          // Check if user just completed onboarding (has onboardingCompleted flag)
          const justCompletedOnboarding = userData?.onboardingCompleted && 
                                        !userData?.hasSeenHomeWalkthrough;

          // Check if coming from calculator with showWalkthrough flag
          const fromCalculatorWithWalkthrough = route.params?.showWalkthrough;

          if (justCompletedOnboarding || fromCalculatorWithWalkthrough) {
            console.log('🔄 Showing home screen walkthrough for new user');
            // Small delay to ensure home screen is fully rendered
            setTimeout(() => {
              setShowWalkthrough(true);
              setCurrentStep(0);
            }, 1500);
            
            // Mark as seen in database
            await firestore().collection('users').doc(user.uid).update({
              hasSeenHomeWalkthrough: true
            });
          }
          
          setHasCheckedWalkthrough(true);
        }
      } catch (error) {
        console.error('Error checking walkthrough status:', error);
        setHasCheckedWalkthrough(true);
      }
    };

    checkFirstTimeUser();
  }, [user?.uid, hasCheckedWalkthrough, route.params]);

  // Clear route params after processing to prevent re-triggering
  useEffect(() => {
    if (route.params?.showWalkthrough) {
      // Clear the parameter after use
      navigation.setParams({ showWalkthrough: undefined });
    }
  }, [route.params, navigation]);

  // SINGLE FUNCTION TO HANDLE THE COMPLETE FLOW
  const handleAfterWalkthrough = async () => {
    try {
      console.log('🔄 Starting post-walkthrough flow...');
      
      // Step 1: Check and show badge popup
      await checkAndShowWelcomeBadge();
      
      // If badge popup was shown, we'll check referral rewards AFTER badge closes
      // The check for referral rewards happens in the badge popup's onClose handler
      
    } catch (error) {
      console.error('Error in post-walkthrough flow:', error);
    }
  };

  // NEW FUNCTION: Check and show welcome badge
  const checkAndShowWelcomeBadge = async () => {
    try {
      console.log('🔍 Checking for welcome badge...');
      
      // Check if user has the welcome badge unlocked
      const unlockedBadges = await badgesRepository.getUnlockedBadgesForUser(user.uid);
      const welcomeBadgeId = "8HxNEC8FmZoszwYMRWbM";
      
      if (unlockedBadges[welcomeBadgeId]) {
        console.log('✅ User has welcome badge, fetching badge details...');
        // Get badge details from badges collection
        const badgeDetails = await badgesRepository.getBadgeById(welcomeBadgeId);
        
        if (badgeDetails) {
          // Check if we should show the popup (only show once)
          const hasSeenBadgePopup = await firestore()
            .collection('users')
            .doc(user.uid)
            .get()
            .then(doc => doc.data()?.hasSeenWelcomeBadgePopup);
          
          if (!hasSeenBadgePopup) {
            console.log('🎉 Showing welcome badge popup!');
            setWelcomeBadge(badgeDetails);
            setShowBadgePopup(true);
            
            // Mark as seen in database
            await firestore().collection('users').doc(user.uid).update({
              hasSeenWelcomeBadgePopup: true
            });
          } else {
            // If already seen badge popup, check referral rewards immediately
            console.log('✅ Already seen badge popup, checking referral rewards...');
            await checkReferralRewards();
          }
        }
      } else {
        // If no badge, check referral rewards immediately
        console.log('❌ No welcome badge found, checking referral rewards...');
        await checkReferralRewards();
      }
      
      setHasCheckedBadge(true);
    } catch (error) {
      console.error('Error checking welcome badge:', error);
      setHasCheckedBadge(true);
    }
  };

  // NEW FUNCTION: Check referral rewards
  const checkReferralRewards = async () => {
    try {
      if (user?.uid && !hasCheckedReferralRewards) {
        console.log('🔍 Checking for referral rewards...');
        
        const { shouldShow, alreadyClaimed } = await shouldShowReferralRewards(user.uid);
        
        if (shouldShow && !alreadyClaimed) {
          console.log('🎉 User is eligible for referral rewards!');
          // Show referral rewards popup
          setTimeout(() => {
            setShowReferralRewards(true);
          }, 300);
        } else {
          console.log('❌ Not eligible for referral rewards or already claimed');
        }
        
        setHasCheckedReferralRewards(true);
      }
    } catch (error) {
      console.error('Error checking referral rewards:', error);
      setHasCheckedReferralRewards(true);
    }
  };

  // NEW FUNCTION: Handle badge popup close
  const handleBadgePopupClose = () => {
    console.log('📌 Badge popup closed, now checking referral rewards...');
    setShowBadgePopup(false);
    // Check referral rewards after badge popup is closed
    checkReferralRewards();
  };

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
      setupRealtimeTerraCoins();
      checkMonthlyFootprint();
      checkSuspensionStatus();
    }

    // Cleanup subscription on unmount
    return () => {
      if (user?.uid) {
        const unsubscribe = firestore()
          .collection('users')
          .doc(user.uid)
          .onSnapshot(() => {});
        unsubscribe();
      }
    };
  }, [user?.uid]);

  // NEW FUNCTION: Handle claiming referral rewards
  const handleClaimReferralRewards = async () => {
    try {
      setIsClaimingReferralRewards(true);
      
      const result = await addReferralRewards(user.uid);
      
      if (result.success) {
        console.log('✅ Referral rewards claimed successfully');
        // Update local state to reflect new coins/points
        // The real-time subscription will update this automatically
        setShowReferralRewards(false);
        
        // Show success confirmation popup instead of Alert.alert
        setShowClaimSuccessPopup(true);
        
      } else {
        // Show error using ConfirmationPopup
        setShowClaimSuccessPopup(false);
        // You could also create an error popup here if needed
        Alert.alert(
          'Error',
          result.error || 'Failed to claim rewards. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error claiming referral rewards:', error);
      setShowClaimSuccessPopup(false);
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsClaimingReferralRewards(false);
    }
  };

  // NEW FUNCTION: Handle success popup close
  const handleSuccessPopupClose = () => {
    setShowClaimSuccessPopup(false);
  };

  // Calculate precise positions based on your layout
  const TOP_BAR_HEIGHT = vScale(90);
  const CONTENT_TOP = TOP_BAR_HEIGHT;
  const CARD_HEIGHT = vScale(160);
  
  // First row of cards starts right after top bar
  const FIRST_ROW_TOP = CONTENT_TOP + PADDING;
  // Second row starts after first row + gap
  const SECOND_ROW_TOP = FIRST_ROW_TOP + CARD_HEIGHT + GAP;
  // Shop box starts after second row + gap
  const SHOP_BOX_TOP = SECOND_ROW_TOP + CARD_HEIGHT + GAP;
  // Community box starts after shop box + gap
  const COMMUNITY_BOX_TOP = SHOP_BOX_TOP + vScale(90) + GAP;

  // Walkthrough step information with precise positioning
  const getStepInfo = (step) => {
    const steps = [
      {
        title: 'Weekly Quiz',
        description: 'Take our weekly quiz to test your environmental knowledge and earn Terra Coins! Complete it every week for new questions and rewards.',
        highlightStyle: { 
          top: FIRST_ROW_TOP,
          left: PADDING, 
          width: CARD_WIDTH, 
          height: CARD_HEIGHT 
        },
        tooltipStyle: { 
          top: FIRST_ROW_TOP + CARD_HEIGHT + 20,
          left: PADDING,
          right: PADDING
        }
      },
      {
        title: 'Achievements',
        description: 'Complete various achievements to earn rewards and track your environmental progress! Unlock badges and special rewards.',
        highlightStyle: { 
          top: FIRST_ROW_TOP,
          left: PADDING + CARD_WIDTH + GAP, 
          width: CARD_WIDTH, 
          height: CARD_HEIGHT 
        },
        tooltipStyle: { 
          top: FIRST_ROW_TOP + CARD_HEIGHT + 20,
          left: PADDING,
          right: PADDING
        }
      },
      {
        title: 'Read & Learn',
        description: 'Access educational content about sustainability and environmental protection. Learn while earning Terra Coins!',
        highlightStyle: { 
          top: SECOND_ROW_TOP,
          left: PADDING, 
          width: CARD_WIDTH, 
          height: CARD_HEIGHT 
        },
        tooltipStyle: { 
          top: SECOND_ROW_TOP + CARD_HEIGHT + 20,
          left: PADDING,
          right: PADDING
        }
      },
      {
        title: 'Invite Friends',
        description: 'Invite friends to join TerraTrack and earn bonus coins! Grow our community and multiply your environmental impact.',
        highlightStyle: { 
          top: SECOND_ROW_TOP,
          left: PADDING + CARD_WIDTH + GAP, 
          width: CARD_WIDTH, 
          height: CARD_HEIGHT 
        },
        tooltipStyle: { 
          top: SECOND_ROW_TOP + CARD_HEIGHT + 20,
          left: PADDING,
          right: PADDING
        }
      },
      {
        title: 'Terra Shop',
        description: 'Spend your Terra Coins on exclusive avatars, rewards, and partner offers! Customize your experience and support eco-friendly brands.',
        highlightStyle: { 
          top: SHOP_BOX_TOP,
          left: PADDING, 
          right: PADDING,
          width: width - (PADDING * 2),
          height: vScale(90)
        },
        tooltipStyle: { 
          top: SHOP_BOX_TOP + vScale(90) + 20,
          left: PADDING,
          right: PADDING
        }
      },
      {
        title: 'Community Progress',
        description: 'See how our community is working together to achieve environmental goals! Track collective impact and milestones.',
        highlightStyle: { 
          top: COMMUNITY_BOX_TOP,
          left: PADDING, 
          right: PADDING,
          width: width - (PADDING * 2),
          height: vScale(140)
        },
        tooltipStyle: { 
          top: height * 0.4,
          left: PADDING,
          right: PADDING
        }
      },
      {
        title: 'Navigation',
        description: 'Use the bottom navigation to access all app sections: Home, Routine, Leaderboards, and your Profile.',
        highlightStyle: { 
          top: height - 80, // Bottom navigation area
          left: 0, 
          right: 0,
          width: width,
          height: 80
        },
        tooltipStyle: { 
          bottom: height * 0.4, // Position above the navigation area
          left: PADDING,
          right: PADDING
        }
      }
    ];
    
    return steps[step];
  };

  // Walkthrough navigation handlers
  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteWalkthrough();
    }
  };

  const handleSkipWalkthrough = () => {
    setShowWalkthrough(false);
    setCurrentStep(0);
    // Start the post-walkthrough flow
    handleAfterWalkthrough();
  };

  const handleCompleteWalkthrough = () => {
    setShowWalkthrough(false);
    setCurrentStep(0);
    // Start the post-walkthrough flow
    handleAfterWalkthrough();
  };

  // REAL-TIME TerraCoins subscription
  const setupRealtimeTerraCoins = () => {
    if (!user?.uid) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const userData = doc.data();
            setTerraCoins(userData.terraCoins || 0);
            
            // Also update user data for suspension check
            setUserData(userData);
            setUserStatus(userData.status);
            
            // Show suspension popup if user is suspended or banned
            if (userData.status === 'suspended' || userData.status === 'banned') {
              setShowSuspensionPopup(true);
            } else if (userData.suspendedCount === 1 && userData.status === 'active') {
              // Show warning if status is active but has 1 suspension count
              setShowSuspensionPopup(true);
            }
          }
        },
        (error) => {
          console.error('Error in real-time TerraCoins subscription:', error);
          // Fallback to one-time fetch if real-time fails
          fetchTerraCoinsFallback();
        }
      );

    return unsubscribe;
  };

  // Fallback function if real-time fails
  const fetchTerraCoinsFallback = async () => {
    try {
      const result = await getUserTerraCoins(user.uid);
      if (result.success) {
        setTerraCoins(result.terraCoins);
      }
    } catch (error) {
      console.error('Error fetching TerraCoins fallback:', error);
    }
  };

  // NEW FUNCTION: Check user suspension status
  const checkSuspensionStatus = async () => {
    try {
      const doc = await firestore().collection('users').doc(user.uid).get();
      if (doc.exists) {
        const userData = doc.data();
        setUserData(userData);
        setUserStatus(userData.status);
        
        // Show suspension popup if user is suspended or banned
        if (userData.status === 'suspended' || userData.status === 'banned') {
          setShowSuspensionPopup(true);
        } else if (userData.suspendedCount === 1 && userData.status === 'active') {
          // Show warning if status is active but has 1 suspension count
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

  // NEW FUNCTION: Handle Weekly Quiz Press with Confirmation
  const handleWeeklyQuizPress = () => {
    if (weeklyQuizAttempted) {
      Alert.alert(
        'Quiz Completed',
        'You have already taken this week\'s quiz. Please check back next week for a new quiz!',
        [{ text: 'OK' }]
      );
      return;
    }

    // Show confirmation popup before proceeding to quiz
    setShowQuizConfirmation(true);
  };

  // NEW FUNCTION: Navigate to Weekly Quiz
  const navigateToWeeklyQuiz = () => {
    setShowQuizConfirmation(false);
    navigation.navigate('WeeklyQuizScreen');
  };

  const handleCardPress = (item) => {
    if (item.title === 'Weekly Quiz') {
      handleWeeklyQuizPress();
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
      {/* REFERRAL REWARDS POPUP - Shows ONLY after badge popup is closed */}
      <ReferralRewardPopup
        visible={showReferralRewards}
        onClaim={handleClaimReferralRewards}
        isClaiming={isClaimingReferralRewards}
      />

      {/* SUCCESS CONFIRMATION POPUP - Shows after claiming rewards */}
      <ConfirmationPopup
        visible={showClaimSuccessPopup}
        title="Success!"
        message="You have claimed 15 Terra Coins and 50 Terra Points!"
        confirmText="OK"
        showCancel={false}
        type="success"
        onConfirm={handleSuccessPopupClose}
      />

      {/* BADGE POPUP - Shows first after walkthrough */}
      <BadgePopup
        visible={showBadgePopup}
        badge={welcomeBadge}
        onClose={handleBadgePopupClose} // This triggers referral check AFTER badge closes
      />

      {/* WALKTHROUGH OVERLAY */}
      <WalkthroughOverlay
        visible={showWalkthrough}
        currentStep={currentStep}
        onNext={handleNextStep}
        onSkip={handleSkipWalkthrough}
        onComplete={handleCompleteWalkthrough}
        getStepInfo={getStepInfo}
      />

      {/* SUSPENSION POPUP - BLOCKING MODAL */}
      <SuspensionPopup
        userId={user?.uid}
        userData={userData}
        visible={showSuspensionPopup}
        onClose={() => {
          // Only allow closing for warnings, not for suspensions/bans
          if (userStatus === 'active' && userData?.suspendedCount === 1) {
            setShowSuspensionPopup(false);
          }
        }}
      />

      {/* WEEKLY QUIZ CONFIRMATION POPUP */}
      <ConfirmationPopup
        visible={showQuizConfirmation}
        title="Ready for Weekly Quiz?"
        message="Once you start the weekly quiz, you won't be able to go back until you complete the question. Make sure you're ready!"
        confirmText="Start Quiz"
        cancelText="Not Yet"
        type="success"
        showCancel={true}
        onConfirm={navigateToWeeklyQuiz}
        onCancel={() => setShowQuizConfirmation(false)}
      />

      {/* HOMESCREEN CONTENT - DISABLED WHEN SUSPENDED/BANNED */}
      <View style={[
        styles.contentContainer,
        (userStatus === 'suspended' || userStatus === 'banned') && styles.disabledContent
      ]}>
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
              <View style={{ marginTop: vScale(8), alignItems: 'center', width: '100%' }}>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  contentContainer: { flex: 1 },
  disabledContent: { opacity: 0.3 }, // Dim the content when suspended/banned
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  errorBanner: { backgroundColor: 'red', padding: 10, borderRadius: 5, marginBottom: 10 },
  errorText: { color: '#fff', textAlign: 'center' },

  topBar: {
    height: vScale(90),
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

 // Walkthrough Styles - UPDATED
  walkthroughContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  lightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Much lighter overlay
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlaySection: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Lighter overlay sections
  },
  middleSection: {
    flexDirection: 'row',
  },
  highlightArea: {
    backgroundColor: 'transparent',
    position: 'relative',
  },
  highlightBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: '#415D43',
    borderRadius: 15,
    // REMOVED shadow properties to eliminate fade/shadow effect
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 999,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#415D43',
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  walkthroughButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#415D43',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#415D43',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignSelf: 'center',
    minWidth: 120,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;