// repositories/referralRepository.js
import firestore from '@react-native-firebase/firestore';

const REFERRAL_COLLECTION = 'referral';
const CONFIG_DOC = 'config';

export const referralRepository = {
  // Get referral settings
  getSettings: async () => {
    try {
      const docRef = firestore().collection(REFERRAL_COLLECTION).doc(CONFIG_DOC);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        // If config doesn't exist, create default
        const defaultSettings = {
          referee: { terraCoins: 0, terraPoints: 0 },
          referrer: { terraCoins: 0, terraPoints: 0 },
          maxInvites: 0,
          goalTasks: 0,
          goalEducational: 0,
          goalWeeklyQuiz: 0,
        };
        await docRef.set(defaultSettings);
        return defaultSettings;
      }

      return docSnap.data();
    } catch (err) {
      console.error('Failed to get referral settings:', err);
      throw err;
    }
  },

  // Update referral settings
  updateSettings: async (settings) => {
    try {
      const docRef = firestore().collection(REFERRAL_COLLECTION).doc(CONFIG_DOC);
      await docRef.set(settings, { merge: true });
      return true;
    } catch (err) {
      console.error('Failed to update referral settings:', err);
      throw err;
    }
  },
};
