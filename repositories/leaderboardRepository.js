import firestore from '@react-native-firebase/firestore';

export const getLeaderboard = async (limit = 10) => {
  try {
    const snapshot = await firestore()
      .collection('users')
      .orderBy('terraPoints', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc, index) => ({
      id: doc.id,
      rank: index + 1,
      username: doc.data().username,
      terraPoints: doc.data().terraPoints || 0,
    }));
  } catch (error) {
    console.error('Error fetching top users:', error);
    throw error;
  }
};
