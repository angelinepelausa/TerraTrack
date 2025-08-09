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