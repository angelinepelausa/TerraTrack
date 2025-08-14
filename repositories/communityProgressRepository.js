import firestore from '@react-native-firebase/firestore';

export const getCommunityProgress = async () => {
  try {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    const docId = `${year}-Q${quarter}`;

    console.log('Fetching community progress for docId:', docId);

    const doc = await firestore()
      .collection('community_progress')
      .doc(docId)
      .get();

    if (!doc.exists) {
      console.warn('Community progress document not found.');
      return null;
    }

    console.log('Community progress data:', doc.data());
    return doc.data();
  } catch (error) {
    console.error('Error fetching community progress:', error);
    throw error;
  }
};
