import firestore from '@react-native-firebase/firestore';
import { avatarsRepository } from './avatarsRepository';

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

const generateReferralCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let referralCode = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters[randomIndex];
  }
  
  return referralCode;
};

export const createUserDocument = async (userData) => {
  try {
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
        referredBy: null, 
      });

    return { success: true, referralCode };
  } catch (error) {
    console.error("Firestore error in createUserDocument:", error);
    return { success: false, error: error.message, code: error.code };
  }
};

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

export const shouldShowReferralRewards = async (userId) => {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return { shouldShow: false, alreadyClaimed: true };
    }
    
    const userData = userDoc.data();
    
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

export const addReferralRewards = async (userId) => {
  try {
    const userRef = firestore().collection('users').doc(userId);
    
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();

    const alreadyClaimed = userData.referralRewardsClaimed || false;
    if (alreadyClaimed) {
      return { success: false, error: 'Referral rewards already claimed' };
    }

    if (!userData.referredBy) {
      return { success: false, error: 'User was not referred' };
    }

    await firestore().runTransaction(async (transaction) => {
      const freshDoc = await transaction.get(userRef);
      const freshData = freshDoc.data();

      const freshClaimed = freshData.referralRewardsClaimed || false;
      if (freshClaimed) {
        throw new Error('Rewards already claimed');
      }
      
      const newCoins = (freshData.terraCoins || 0) + 15;
      const newPoints = (freshData.terraPoints || 0) + 50;
      
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