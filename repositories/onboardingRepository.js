import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const saveOnboardingPreferences = async (preferences) => {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('onboarding')
      .doc('preferences')
      .set(preferences, { merge: true });

    return true;
  } catch (error) {
    console.error('Error saving onboarding preferences:', error);
    throw error;
  }
};

export const checkOnboardingStatus = async (userId) => {
  try {
    const doc = await firestore()
      .collection('users')
      .doc(userId)
      .collection('onboarding')
      .doc('preferences')
      .get();
    
    return doc.exists && Object.keys(doc.data() || {}).length > 0;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    throw error;
  }
};

const getUserPreferences = async (userId) => {
  try {
    const doc = await firestore()
      .collection('users')
      .doc(userId)
      .collection('onboarding')
      .doc('preferences')
      .get();

    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

export const validateAndApplyReferral = async (referralCode) => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    const querySnap = await firestore()
      .collection('users')
      .where('referralCode', '==', referralCode)
      .limit(1)
      .get();

    if (querySnap.empty) {
      throw new Error('Invalid referral code');
    }

    const referrerDoc = querySnap.docs[0];
    const referrerId = referrerDoc.id;

    await firestore()
      .collection('users')
      .doc(currentUser.uid)
      .set({ referredBy: referrerId }, { merge: true });

    await firestore()
      .collection('users')
      .doc(referrerId)
      .collection('invites')
      .doc(currentUser.uid)
      .set({
        taskFinished: 0,
        weeklyQuizFinished: 0,
        educationalQuizFinished: 0,
        rewardsClaimed: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

    return true;
  } catch (error) {
    console.error('Referral validation error:', error);
    throw error;
  }
};

export const onboardingRepository = {
  saveOnboardingPreferences,
  checkOnboardingStatus,
  getUserPreferences,
  validateAndApplyReferral,
};
