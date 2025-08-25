import firestore from '@react-native-firebase/firestore';

export const getCommunityProgress = async () => {
  try {
    const docSnap = await firestore()
      .collection('community_progress')
      .doc('2025-Q3')
      .get();

    if (!docSnap.exists) return null;

    return docSnap.data();
  } catch (error) {
    console.error('Error fetching community progress:', error);
    throw error;
  }
};

export const getCommunityLeaderboard = async () => {
  try {
    const data = await getCommunityProgress();
    if (!data) return [];

    const contributorsMap = data.contributors || {};
    const rewards = data.rewards || {};

    const contributorsArray = await Promise.all(
      Object.entries(contributorsMap).map(async ([uid, points]) => {
        const userDoc = await firestore().collection('users').doc(uid).get();
        const username = userDoc.exists ? userDoc.data().username : uid;
        return {
          id: uid,
          username,
          terraPoints: points,
        };
      })
    );

    contributorsArray.sort((a, b) => b.terraPoints - a.terraPoints);

    contributorsArray.forEach((item, index) => {
      item.rank = index + 1;
      if (item.rank === 1) item.reward = rewards.top1;
      else if (item.rank === 2) item.reward = rewards.top2;
      else if (item.rank === 3) item.reward = rewards.top3;
      else if (item.rank >= 4 && item.rank <= 10) item.reward = rewards.top4to10;
      else item.reward = rewards.top11plus;
    });

    return contributorsArray;
  } catch (error) {
    console.error('Error fetching community leaderboard:', error);
    throw error;
  }
};

export const getUserCommunityRank = async (userId) => {
  const leaderboard = await getCommunityLeaderboard();
  return leaderboard.find((u) => u.id === userId) || null;
};
