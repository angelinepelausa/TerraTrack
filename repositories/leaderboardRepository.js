import firestore from '@react-native-firebase/firestore';
import { computeWeeklyCycle } from '../utils/leaderboardUtils';
import { populateUserData } from './userRepository'; // centralized user data

const CONFIG_DOC = firestore().collection('leaderboard').doc('config');
const RESULTS_COLLECTION = firestore().collection('leaderboard');

// Leaderboard config
export const getLeaderboardConfig = async () => {
  const snapshot = await CONFIG_DOC.get();

  if (!snapshot.exists) {
    const defaultConfig = {
      rewards: {
        top1: { terraCoins: 300, terraPoints: 30 },
        top2: { terraCoins: 200, terraPoints: 20 },
        top3: { terraCoins: 100, terraPoints: 10 },
        top4to10: { terraCoins: 50, terraPoints: 5 },
        top11plus: { terraCoins: 30, terraPoints: 3 },
      },
      pendingConfig: null,
      lastAppliedCycleStart: null,
    };
    await CONFIG_DOC.set(defaultConfig);
    return defaultConfig;
  }

  return snapshot.data();
};

// Save or update pending config
export const saveOrUpdatePendingConfig = async (rewards) => {
  const currentConfig = await getLeaderboardConfig();
  const pendingConfig = currentConfig.pendingConfig
    ? { ...currentConfig.pendingConfig, rewards, savedAt: firestore.Timestamp.now() }
    : { rewards, savedAt: firestore.Timestamp.now() };

  await CONFIG_DOC.set({ pendingConfig }, { merge: true });
};

// Delete pending config
export const deletePendingConfig = async () => {
  await CONFIG_DOC.set({ pendingConfig: null }, { merge: true });
};

// Get leaderboard top users
export const getLeaderboard = async (limit = 10) => {
  const snapshot = await firestore()
    .collection('users')
    .orderBy('terraPoints', 'desc')
    .limit(limit)
    .get();

  const leaderboard = await Promise.all(
    snapshot.docs.map(async (doc, index) => {
      const data = doc.data();
      const { username, avatar: avatarUrl } = await populateUserData(doc.id);

      return {
        id: doc.id,
        rank: index + 1,
        username,
        terraPoints: data.terraPoints || 0,
        avatarUrl,
      };
    })
  );

  return leaderboard;
};

// Get user rank
export const getUserRank = async (userId) => {
  const snapshot = await firestore()
    .collection('users')
    .orderBy('terraPoints', 'desc')
    .get();

  const allUsers = await Promise.all(
    snapshot.docs.map(async (doc, index) => {
      const { username, avatar: avatarUrl } = await populateUserData(doc.id);
      return {
        id: doc.id,
        rank: index + 1,
        username,
        terraPoints: doc.data().terraPoints || 0,
        avatarUrl,
      };
    })
  );

  return allUsers.find(user => user.id === userId) || null;
};

// Get all users with rank
export const getAllUsers = async () => {
  const snapshot = await firestore()
    .collection('users')
    .orderBy('terraPoints', 'desc')
    .get();

  let rank = 1;
  return Promise.all(
    snapshot.docs.map(async (doc) => {
      const { username, avatar: avatarUrl } = await populateUserData(doc.id);
      return {
        id: doc.id,
        rank: rank++,
        username,
        terraPoints: doc.data().terraPoints || 0,
        avatarUrl,
      };
    })
  );
};

// Add rewards to user
export const addUserRewards = async (userId, terraCoins, terraPoints) => {
  try {
    const userRef = firestore().collection('users').doc(userId);
    await userRef.update({
      terraCoins: firestore.FieldValue.increment(terraCoins),
      terraPoints: firestore.FieldValue.increment(terraPoints),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding user rewards:", error);
    return { success: false, error: error.message };
  }
};

// Distribute leaderboard rewards
export const distributeLeaderboardRewards = async (config) => {
  try {
    const allUsers = await getAllUsers();

    const { start: currentStart } = computeWeeklyCycle();
    const lastCycleEnd = new Date(currentStart);
    lastCycleEnd.setDate(lastCycleEnd.getDate() - 1);
    const lastCycleStart = new Date(lastCycleEnd);
    lastCycleStart.setDate(lastCycleEnd.getDate() - 6);

    const resultId = `result_${lastCycleEnd.toISOString().split('T')[0]}`;
    const resultDocRef = RESULTS_COLLECTION.doc(resultId);

    let totalCoins = 0;
    let totalPoints = 0;
    const batch = firestore().batch();

    batch.set(resultDocRef, {
      cycleStart: firestore.Timestamp.fromDate(lastCycleStart),
      cycleEnd: firestore.Timestamp.fromDate(lastCycleEnd),
      distributedAt: firestore.Timestamp.now(),
      totalUsers: allUsers.length,
      totalTerraCoinsDistributed: 0,
      totalTerraPointsDistributed: 0,
    });

    for (const user of allUsers) {
      let rewardConfig;
      if (user.rank === 1) rewardConfig = config.top1;
      else if (user.rank === 2) rewardConfig = config.top2;
      else if (user.rank === 3) rewardConfig = config.top3;
      else if (user.rank >= 4 && user.rank <= 10) rewardConfig = config.top4to10;
      else rewardConfig = config.top11plus;

      const userRef = firestore().collection("users").doc(user.id);
      batch.update(userRef, {
        terraCoins: firestore.FieldValue.increment(rewardConfig.terraCoins),
        terraPoints: rewardConfig.terraPoints,
      });

      const userResultRef = resultDocRef.collection("users").doc(user.id);
      batch.set(userResultRef, {
        username: user.username,
        rank: user.rank,
        score: user.terraPoints,
        terraCoins: rewardConfig.terraCoins,
        terraPoints: rewardConfig.terraPoints,
        avatarUrl: user.avatarUrl,
      });

      totalCoins += rewardConfig.terraCoins;
      totalPoints += rewardConfig.terraPoints;
    }

    batch.update(resultDocRef, {
      totalTerraCoinsDistributed: totalCoins,
      totalTerraPointsDistributed: totalPoints,
    });

    await batch.commit();

    return {
      success: true,
      results: {
        cycleStart: lastCycleStart,
        cycleEnd: lastCycleEnd,
        totalUsers: allUsers.length,
        totalTerraCoinsDistributed: totalCoins,
        totalTerraPointsDistributed: totalPoints,
      },
    };
  } catch (error) {
    console.error("Error distributing rewards:", error);
    return { success: false, error: error.message };
  }
};

// Apply pending config if needed
export const applyPendingConfigIfNeeded = async () => {
  const { start: currentStart } = computeWeeklyCycle(); 
  const config = await getLeaderboardConfig();

  if (
    config.lastAppliedCycleStart &&
    config.lastAppliedCycleStart.toMillis &&
    new Date(config.lastAppliedCycleStart.toMillis()).getTime() === currentStart.getTime()
  ) {
    return { applied: false, reason: 'Already applied this cycle' };
  }

  let appliedConfig = config.rewards;

  if (config.pendingConfig) {
    appliedConfig = config.pendingConfig.rewards;
    await CONFIG_DOC.set(
      {
        rewards: appliedConfig,
        lastAppliedCycleStart: firestore.Timestamp.fromDate(currentStart),
        pendingConfig: null,
      },
      { merge: true }
    );
  } else {
    await CONFIG_DOC.set(
      {
        lastAppliedCycleStart: firestore.Timestamp.fromDate(currentStart),
      },
      { merge: true }
    );
  }

  const distributionResult = await distributeLeaderboardRewards(appliedConfig);

  return {
    applied: true,
    config: appliedConfig,
    distribution: distributionResult,
  };
};

// Get last reward of a user
export const getUserLastReward = async (userId) => {
  try {
    if (!userId) return null;

    const { start: currentStart } = computeWeeklyCycle();
    const lastCycleEnd = new Date(currentStart);
    lastCycleEnd.setDate(lastCycleEnd.getDate() - 1);

    const resultId = `result_${lastCycleEnd.toISOString().split('T')[0]}`;

    const userDoc = await firestore()
      .collection('leaderboard')
      .doc(resultId)
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) return null;

    const data = userDoc.data();
    return {
      terraCoins: data?.terraCoins || 0,
      terraPoints: data?.terraPoints || data?.score || 0,
      cycleDate: resultId,
      avatarUrl: data?.avatarUrl || null,
      username: data?.username || null,
    };
  } catch (error) {
    console.error('Error fetching user last reward:', error);
    return null;
  }
};

// Get last cycle summary
export const getLastCycleSummary = async () => {
  try {
    const { start: currentStart } = computeWeeklyCycle();
    const lastCycleEnd = new Date(currentStart);
    lastCycleEnd.setDate(lastCycleEnd.getDate() - 1);
    const resultId = `result_${lastCycleEnd.toISOString().split("T")[0]}`;

    const resultDoc = await firestore().collection("leaderboard").doc(resultId).get();
    if (!resultDoc.exists) return null;

    return { id: resultId, ...resultDoc.data() };
  } catch (error) {
    console.error("Error fetching cycle summary:", error);
    return null;
  }
};

// Get user's leaderboard history
export const getUserLeaderboardHistory = async (userId) => {
  try {
    const snapshot = await firestore().collection("leaderboard").orderBy("cycleEnd", "desc").get();
    const history = [];

    for (const doc of snapshot.docs) {
      const userResultSnap = await doc.ref.collection("users").doc(userId).get();
      if (userResultSnap.exists) {
        history.push({
          cycleId: doc.id,
          cycleStart: doc.data().cycleStart?.toDate(),
          cycleEnd: doc.data().cycleEnd?.toDate(),
          ...userResultSnap.data(),
        });
      }
    }

    return history;
  } catch (error) {
    console.error("Error fetching user leaderboard history:", error);
    return [];
  }
};

export default {
  getLeaderboardConfig,
  saveOrUpdatePendingConfig,
  deletePendingConfig,
  getLeaderboard,
  getUserRank,
  getAllUsers,
  addUserRewards,
  distributeLeaderboardRewards,
  applyPendingConfigIfNeeded,
  getUserLastReward,
  getLastCycleSummary,
  getUserLeaderboardHistory,
};
