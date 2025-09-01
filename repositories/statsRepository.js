import firestore from '@react-native-firebase/firestore';

export const statsRepository = {
  async getUserStats(userId) {
    const snapshot = await firestore()
      .collection('users')
      .doc(userId)
      .collection('footprints')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },
};
