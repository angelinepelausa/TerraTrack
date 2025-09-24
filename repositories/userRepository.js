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
    const referralCode = generateReferralCode();
    const defaultAvatarId = "ZPbPGHol6O29uGaqxaum"; 

    await firestore()
      .collection("users")
      .doc(userData.userId)
      .set(
        {
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          username: userData.username,
          terraCoins: 0,
          terraPoints: 0,
          referralCode: referralCode,
          createdAt: firestore.FieldValue.serverTimestamp(),
          status: "Active",
          avatar: defaultAvatarId, 
        },
        { merge: true }
      );

    return { success: true, referralCode };
  } catch (error) {
    console.error("Firestore error:", error);
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

// Get user's TerraCoins, TerraPoints, username, and avatar
export const getUserTerraCoins = async (userId) => {
  try {
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (userDoc.exists) {
      const { terraCoins = 0, terraPoints = 0 } = userDoc.data();
      const { username, avatar } = await populateUserData(userId);
      return { 
        success: true, 
        terraCoins, 
        terraPoints,
        username,
        avatar
      };
    } else {
      return { success: false, error: 'User not found' };
    }
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
