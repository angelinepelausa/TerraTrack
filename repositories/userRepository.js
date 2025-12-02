import firestore from '@react-native-firebase/firestore';
import { avatarsRepository } from './avatarsRepository';

// --- Helper: fetch username and avatar for a user ---
export const populateUserData = async (userId) => {
  let username = "Unknown User";
  let avatar = null;

  if (!userId) return { username, avatar };

  try {
    const userDoc = await firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) return { username, avatar };

    const userData = userDoc.data();
    username = userData.username || username;

    if (userData.avatar) {
      const avatarDoc = await firestore().collection('avatars').doc(userData.avatar).get();
      if (avatarDoc.exists) avatar = avatarDoc.data()?.imageurl || null;
    }
  } catch (err) {
    console.warn('populateUserData error:', err);
  }

  return { username, avatar };
};

// Generate a 6-character referral code
const generateReferralCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters[randomIndex];
  }
  
  return referralCode;
};

// Create a new user document
export const createUserDocument = async (userData) => {
  try {
    // Validate required fields
    if (!userData.userId || !userData.email || !userData.username) {
      console.error('Missing required fields in createUserDocument:', userData);
      return { success: false, error: 'Missing required user data' };
    }

    const referralCode = generateReferralCode();
    const defaultAvatarId = "ZPbPGHol6O29uGaqxaum"; 

    await firestore()
      .collection("users")
      .doc(userData.userId)
      .set({
        email: userData.email,
        username: userData.username,
        terraCoins: 0,
        terraPoints: 0,
        referralCode: referralCode,
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: "Active",
        avatar: defaultAvatarId,
        referredBy: null, // Will be set if user entered a referral code
        // REMOVED: hasSeenReferralRewards and referralRewardsClaimed
        // They will be created when needed, like walkthrough and badge
      });

    return { success: true, referralCode };
  } catch (error) {
    console.error("Firestore error in createUserDocument:", error);
    return { success: false, error: error.message, code: error.code };
  }
};

// Add TerraCoins and TerraPoints to a user
export const addUserRewards = async (userId, coinsEarned, pointsEarned) => {
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        terraCoins: firestore.FieldValue.increment(coinsEarned),
        terraPoints: firestore.FieldValue.increment(pointsEarned),
      });

    return { success: true };
  } catch (error) {
    console.error('Error updating rewards:', error);
    return { success: false, error: error.message };
  }
};

// Deduct TerraCoins from a user (for purchases)
export const deductTerraCoins = async (userId, amount) => {
  try {
    const userRef = firestore().collection("users").doc(userId);

    await firestore().runTransaction(async transaction => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");

      const currentTC = userDoc.data()?.terraCoins || 0;
      if (currentTC < amount) throw new Error("Not enough TerraCoins");

      transaction.update(userRef, {
        terraCoins: currentTC - amount
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error deducting TerraCoins:", error);
    return { success: false, error: error.message };
  }
};

export const getUserTerraCoins = async (userId) => {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data() || {};
    const terraCoins = userData.terraCoins ?? 0;
    const terraPoints = userData.terraPoints ?? 0;

    // Populate username and avatar safely
    const { username, avatar } = await populateUserData(userId);

    return { 
      success: true, 
      terraCoins, 
      terraPoints,
      username,
      avatar
    };
  } catch (error) {
    console.error('Error fetching terraCoins:', error);
    return { success: false, error: error.message };
  }
};

// Get user's referral code
export const getUserReferralCode = async (userId) => {
  try {
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (userDoc.exists) {
      const { referralCode = '' } = userDoc.data();
      const { username, avatar } = await populateUserData(userId);
      return { 
        success: true, 
        referralCode,
        username,
        avatar
      };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error fetching referral code:', error);
    return { success: false, error: error.message };
  }
};

// Get users by filter (status, date range)
export const getUsersByFilter = async (filter = {}) => {
  try {
    let query = firestore().collection("users");

    if (filter.status) {
      query = query.where("status", "==", filter.status);
    }

    if (filter.dateRange?.from && filter.dateRange?.to) {
      query = query
        .where("createdAt", ">=", filter.dateRange.from)
        .where("createdAt", "<=", filter.dateRange.to);
    }

    const snapshot = await query.get();

    // Populate username and avatar for each user
    return Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const { username, avatar } = await populateUserData(doc.id);
      return { id: doc.id, ...data, username, avatar };
    }));
  } catch (error) {
    console.error("Error fetching filtered users:", error);
    return [];
  }
};

// --- NEW FUNCTIONS FOR REFERRAL REWARDS ---

// Check if user should see referral rewards popup
export const shouldShowReferralRewards = async (userId) => {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return { shouldShow: false, alreadyClaimed: true };
    }
    
    const userData = userDoc.data();
    
    // Conditions to show popup:
    // 1. User has referredBy field (was invited)
    // 2. Has not seen the popup yet (field doesn't exist or is false)
    // 3. Has not claimed rewards yet (field doesn't exist or is false)
    const hasSeen = userData.hasSeenReferralRewards || false;
    const alreadyClaimed = userData.referralRewardsClaimed || false;
    
    const shouldShow = userData.referredBy && !hasSeen && !alreadyClaimed;
    
    return { 
      shouldShow, 
      alreadyClaimed,
      referredBy: userData.referredBy || null
    };
  } catch (error) {
    console.error('Error checking referral rewards:', error);
    return { shouldShow: false, alreadyClaimed: true };
  }
};

// Add referral rewards to user account
export const addReferralRewards = async (userId) => {
  try {
    const userRef = firestore().collection('users').doc(userId);
    
    // First check if rewards were already claimed
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    
    // Check if already claimed
    const alreadyClaimed = userData.referralRewardsClaimed || false;
    if (alreadyClaimed) {
      return { success: false, error: 'Referral rewards already claimed' };
    }
    
    // Check if user was referred (has referredBy field)
    if (!userData.referredBy) {
      return { success: false, error: 'User was not referred' };
    }
    
    // Update in a transaction to ensure atomicity
    await firestore().runTransaction(async (transaction) => {
      // Get latest user data
      const freshDoc = await transaction.get(userRef);
      const freshData = freshDoc.data();
      
      // Double-check not already claimed
      const freshClaimed = freshData.referralRewardsClaimed || false;
      if (freshClaimed) {
        throw new Error('Rewards already claimed');
      }
      
      // Add rewards (15 Terra Coins + 50 Terra Points)
      const newCoins = (freshData.terraCoins || 0) + 15;
      const newPoints = (freshData.terraPoints || 0) + 50;
      
      // Update user document - create fields if they don't exist
      transaction.update(userRef, {
        terraCoins: newCoins,
        terraPoints: newPoints,
        referralRewardsClaimed: true,
        hasSeenReferralRewards: true,
      });
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error adding referral rewards:', error);
    return { success: false, error: error.message };
  }
};

// Mark referral rewards as seen (without claiming)
export const markReferralRewardsAsSeen = async (userId) => {
  try {
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        hasSeenReferralRewards: true,
      });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking referral rewards as seen:', error);
    return { success: false, error: error.message };
  }
};