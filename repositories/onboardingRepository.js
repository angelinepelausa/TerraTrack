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

/**
 * Only return true if the doc exists AND has at least one field.
 * This avoids false positives from an empty doc.
 */
export const checkOnboardingStatus = async (userId) => {
  try {
    const snap = await firestore()
      .collection('users')
      .doc(userId)
      .collection('onboarding')
      .doc('preferences')
      .get();

    if (!snap.exists) return false;

    const data = snap.data() || {};
    return Object.keys(data).length > 0; // onboarded only if there is content
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false; // fail-safe to show onboarding
  }
};
