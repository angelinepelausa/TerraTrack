import firestore from '@react-native-firebase/firestore';

export const createUserDocument = async (userData) => {
  try {
    await firestore()
      .collection('users')
      .doc(userData.userId)
      .set({
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        username: userData.username,
        terraCoins: 0,
        terraPoints: 0, 
        createdAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Firestore error:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
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
