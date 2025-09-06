import firestore from '@react-native-firebase/firestore';
import { addUserRewards } from './userRepository';

// Utility to get the current year-quarter like "2025-Q3"
export const getCurrentYearQuarter = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  let quarter = 'Q1';

  if (month >= 0 && month <= 2) quarter = 'Q1';
  else if (month >= 3 && month <= 5) quarter = 'Q2';
  else if (month >= 6 && month <= 8) quarter = 'Q3';
  else if (month >= 9 && month <= 11) quarter = 'Q4';

  return `${year}-${quarter}`;
};

// --- Get community progress ---
export const getCommunityProgress = async (yearQuarter = null) => {
  try {
    const docId = yearQuarter || getCurrentYearQuarter();
    const docSnap = await firestore()
      .collection('community_progress')
      .doc(docId)
      .get();

    if (!docSnap.exists) return null;
    return docSnap.data();
  } catch (error) {
    console.error('Error fetching community progress:', error);
    throw error;
  }
};

// --- Add a new quarter's community progress ---
export const addCommunityProgress = async (payload) => {
  try {
    const { yearQuarter, title, description, goal, rewards, image } = payload;
    if (!yearQuarter) throw new Error('Year-Quarter is required');

    const docRef = firestore().collection('community_progress').doc(yearQuarter);

    const [year, quarter] = yearQuarter.split('-');
    let startMonth = 0;
    let endMonth = 2;

    if (quarter === 'Q1') { startMonth = 0; endMonth = 2; }
    else if (quarter === 'Q2') { startMonth = 3; endMonth = 5; }
    else if (quarter === 'Q3') { startMonth = 6; endMonth = 8; }
    else if (quarter === 'Q4') { startMonth = 9; endMonth = 11; }

    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, endMonth + 1, 0, 23, 59, 59);

    await docRef.set({
      title,
      description,
      goal: parseInt(goal, 10),
      current: 0,
      participants: [],
      contributors: {},
      rewards,
      image: image || null,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      finalLeaderboard: [],
      processed: false, // mark quarter as not yet processed
    });

    return true;
  } catch (error) {
    console.error('Error adding community progress:', error);
    throw error;
  }
};

// --- Get leaderboard sorted by contributions or final leaderboard if processed ---
export const getCommunityLeaderboard = async (yearQuarter = null) => {
  try {
    const data = await getCommunityProgress(yearQuarter);
    if (!data) return [];

    // If the quarter is already processed, return the final leaderboard snapshot
    if (data.processed && data.finalLeaderboard && data.finalLeaderboard.length > 0) {
      return data.finalLeaderboard;
    }

    const contributorsMap = data.contributors || {};
    const rewards = data.rewards || {};

    const contributorsArray = await Promise.all(
      Object.entries(contributorsMap).map(async ([uid, points]) => {
        const userDoc = await firestore().collection('users').doc(uid).get();
        const username = userDoc.exists ? userDoc.data().username : uid;
        return { id: uid, username, terraPoints: points };
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

// --- Get a user's rank in the community leaderboard ---
export const getUserCommunityRank = async (userId, yearQuarter = null) => {
  const leaderboard = await getCommunityLeaderboard(yearQuarter);
  return leaderboard.find((u) => u.id === userId) || null;
};

// --- Process end-of-quarter rewards ---
export const processQuarterEnd = async () => {
  try {
    const currentQuarter = getCurrentYearQuarter();
    const docRef = firestore().collection('community_progress').doc(currentQuarter);

    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new Error('No current quarter data found');

    const currentData = docSnap.data();
    if (currentData.processed) return; // already processed

    const leaderboard = await getCommunityLeaderboard(currentQuarter);

    // distribute rewards
    await Promise.all(
      leaderboard.map((user) => addUserRewards(user.id, user.reward.terraCoins, user.reward.terraPoints))
    );

    // update final leaderboard & mark as processed
    await docRef.update({ finalLeaderboard: leaderboard, processed: true });

    console.log(`Quarter ${currentQuarter} processed. Final leaderboard saved.`);
  } catch (error) {
    console.error('Error processing quarter end:', error);
    throw error;
  }
};

// --- Helper: get next quarter ---
export const getNextQuarter = (yearQuarter) => {
  const [yearStr, quarter] = yearQuarter.split('-');
  let year = parseInt(yearStr, 10);
  let nextQuarter = '';

  switch (quarter) {
    case 'Q1': nextQuarter = 'Q2'; break;
    case 'Q2': nextQuarter = 'Q3'; break;
    case 'Q3': nextQuarter = 'Q4'; break;
    case 'Q4':
      nextQuarter = 'Q1';
      year += 1;
      break;
  }

  return `${year}-${nextQuarter}`;
};

// Get all upcoming quarters (quarters that haven't started yet)
export const getUpcomingQuarters = async () => {
  try {
    const now = new Date();
    const snapshot = await firestore()
      .collection('community_progress')
      .where('startDate', '>', now.toISOString())
      .orderBy('startDate', 'asc')
      .get();

    if (snapshot.empty) return [];

    const upcomingQuarters = [];
    snapshot.forEach(doc => {
      upcomingQuarters.push({ id: doc.id, ...doc.data() });
    });

    return upcomingQuarters;
  } catch (error) {
    console.error('Error fetching upcoming quarters:', error);
    throw error;
  }
};

// Delete a community progress quarter
export const deleteCommunityProgress = async (yearQuarter) => {
  try {
    await firestore()
      .collection('community_progress')
      .doc(yearQuarter)
      .delete();
    
    return true;
  } catch (error) {
    console.error('Error deleting community progress:', error);
    throw error;
  }
};

// Update an existing community progress quarter
export const updateCommunityProgress = async (originalYearQuarter, payload) => {
  try {
    const { yearQuarter, ...updateData } = payload;
    
    // If the yearQuarter changed, we need to delete the old document and create a new one
    if (originalYearQuarter !== yearQuarter) {
      // Delete the old document
      await firestore()
        .collection('community_progress')
        .doc(originalYearQuarter)
        .delete();
      
      // Create a new document with the updated yearQuarter
      await firestore()
        .collection('community_progress')
        .doc(yearQuarter)
        .set(updateData);
    } else {
      // Just update the existing document
      await firestore()
        .collection('community_progress')
        .doc(yearQuarter)
        .update(updateData);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating community progress:', error);
    throw error;
  }
};

export default {
  getCurrentYearQuarter,
  getCommunityProgress,
  addCommunityProgress,
  getCommunityLeaderboard,
  getUserCommunityRank,
  processQuarterEnd,
  getNextQuarter,
  getUpcomingQuarters,
  deleteCommunityProgress,
  updateCommunityProgress
};
