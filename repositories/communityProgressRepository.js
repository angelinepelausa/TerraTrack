import firestore from '@react-native-firebase/firestore';

export const getCommunityProgress = async () => {
  try {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    const docId = `${year}-Q${quarter}`;

    const snap = await firestore()
      .collection('community_progress')
      .doc(docId)
      .get();

    if (!snap.exists) {
      return null;
    }

    return snap.data();
  } catch (error) {
    console.error('Error fetching community progress:', error);
    return null;
  }
};
