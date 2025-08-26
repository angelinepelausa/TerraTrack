import firestore from '@react-native-firebase/firestore';

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
    const referralCode = generateReferralCode();

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
        },
        { merge: true }
      );

    return { success: true, referralCode };
  } catch (error) {
    console.error("Firestore error:", error);
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

export const getUserTerraCoins = async (userId) => {
  try {
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (userDoc.exists) {
      const { terraCoins = 0, terraPoints = 0 } = userDoc.data();
      return { 
        success: true, 
        terraCoins, 
        terraPoints
      };
    } else {
      return { 
        success: false, 
        error: 'User not found' 
      };
    }
  } catch (error) {
    console.error('Error fetching terraCoins:', error);
    return { 
      success: false, 
      error: error.message 
    };
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
      return { 
        success: true, 
        referralCode
      };
    } else {
      return { 
        success: false, 
        error: 'User not found' 
      };
    }
  } catch (error) {
    console.error('Error fetching referral code:', error);
    return { 
      success: false, 
      error: error.message 
    };
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
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching filtered users:", error);
    return [];
  }
};
