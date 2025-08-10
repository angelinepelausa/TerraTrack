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