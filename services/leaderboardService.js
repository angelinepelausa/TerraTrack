import firestore from '@react-native-firebase/firestore';

export const fetchTopUsers = async (limit = 10) => {
  try {
    const snapshot = await firestore()
      .collection('users')
      .orderBy('terraPoints', 'desc')
      .limit(limit)
      .get();

    const users = snapshot.docs.map((doc, index) => ({
      userId: doc.id,
      rank: index + 1,
      ...doc.data(),
    }));

    return { success: true, users };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { success: false, error: error.message };
  }
};
