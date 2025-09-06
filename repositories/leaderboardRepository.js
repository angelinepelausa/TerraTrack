import firestore from '@react-native-firebase/firestore';
import { computeWeeklyCycle } from '../utils/leaderboardUtils';
import { addUserRewards } from './userRepository';

const CONFIG_DOC = firestore().collection('leaderboard').doc('config');
const RESULTS_COLLECTION = firestore().collection('leaderboard').doc('results');

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

export const saveOrUpdatePendingConfig = async (rewards) => {
  const currentConfig = await getLeaderboardConfig();

  const pendingConfig = currentConfig.pendingConfig
    ? { ...currentConfig.pendingConfig, rewards, savedAt: firestore.Timestamp.now() }
    : { rewards, savedAt: firestore.Timestamp.now() };

  await CONFIG_DOC.set({ pendingConfig }, { merge: true });
};

export const deletePendingConfig = async () => {
  await CONFIG_DOC.set({ pendingConfig: null }, { merge: true });
};

export const getLeaderboard = async (limit = 10) => {
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
};

export const getUserRank = async (userId) => {
  const snapshot = await firestore()
    .collection('users')
    .orderBy('terraPoints', 'desc')
    .get();

  const allUsers = snapshot.docs.map((doc, index) => ({
    id: doc.id,
    rank: index + 1,
    username: doc.data().username,
    terraPoints: doc.data().terraPoints || 0,
  }));

  return allUsers.find(user => user.id === userId) || null;
};

export const getAllUsers = async () => {
  const snapshot = await firestore()
    .collection('users')
    .orderBy('terraPoints', 'desc')
    .get();

  let rank = 1;
  return snapshot.docs.map(doc => ({
    id: doc.id,
    rank: rank++,
    username: doc.data().username,
    terraPoints: doc.data().terraPoints || 0,
  }));
};

export const distributeLeaderboardRewards = async (config) => {
  try {
    const allUsers = await getAllUsers();
    const { start, end } = computeWeeklyCycle();

    const results = {
      cycleStart: firestore.Timestamp.fromDate(start),
      cycleEnd: firestore.Timestamp.fromDate(end),
      distributedAt: firestore.Timestamp.now(),
      rewards: [],
      totalUsers: allUsers.length,
      totalTerraCoinsDistributed: 0,
      totalTerraPointsDistributed: 0
    };

    const historyRef = await RESULTS_COLLECTION.collection('history').doc();
    const batch = firestore().batch();

    for (const user of allUsers) {
      let rewardConfig;

      if (user.rank === 1) rewardConfig = config.top1;
      else if (user.rank === 2) rewardConfig = config.top2;
      else if (user.rank === 3) rewardConfig = config.top3;
      else if (user.rank >= 4 && user.rank <= 10) rewardConfig = config.top4to10;
      else rewardConfig = config.top11plus;

      await addUserRewards(user.id, rewardConfig.terraCoins, rewardConfig.terraPoints);

      const userResultRef = historyRef.collection("users").doc(user.id);
      batch.set(userResultRef, {
        username: user.username,
        rank: user.rank,
        score: user.terraPoints, 
        terraCoins: rewardConfig.terraCoins,
        terraPoints: rewardConfig.terraPoints
      });

      const userRef = firestore().collection("users").doc(user.id);
      batch.update(userRef, { terraPoints: 0 });

      results.rewards.push({
        userId: user.id,
        username: user.username,
        rank: user.rank,
        score: user.terraPoints,
        terraCoins: rewardConfig.terraCoins,
        terraPoints: rewardConfig.terraPoints
      });

      results.totalTerraCoinsDistributed += rewardConfig.terraCoins;
      results.totalTerraPointsDistributed += rewardConfig.terraPoints;
    }

    batch.set(historyRef, results);

    await batch.commit();

    return { success: true, results };

  } catch (error) {
    console.error("Error distributing rewards:", error);
    return { success: false, error: error.message };
  }
};


export const applyPendingConfigIfNeeded = async () => {
  const { start } = computeWeeklyCycle(); // current Sunday start
  const config = await getLeaderboardConfig();

  if (
    config.lastAppliedCycleStart &&
    config.lastAppliedCycleStart.toMillis &&
    new Date(config.lastAppliedCycleStart.toMillis()).getTime() === start.getTime()
  ) {
    return { applied: false, reason: 'Already applied this cycle' };
  }

  let appliedConfig = config.rewards;

  if (config.pendingConfig) {
    appliedConfig = config.pendingConfig.rewards;
    await CONFIG_DOC.set(
      {
        rewards: appliedConfig,
        lastAppliedCycleStart: firestore.Timestamp.fromDate(start),
        pendingConfig: null,
      },
      { merge: true }
    );
  } else {
    await CONFIG_DOC.set(
      {
        lastAppliedCycleStart: firestore.Timestamp.fromDate(start),
      },
      { merge: true }
    );
  }

  const distributionResult = await distributeLeaderboardRewards(appliedConfig);

  return {
    applied: true,
    config: appliedConfig,
    distribution: distributionResult
  };
};

export const getRewardHistory = async (limit = 10) => {
  try {
    const snapshot = await RESULTS_COLLECTION
      .collection('history')
      .orderBy('distributedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching reward history:', error);
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
  distributeLeaderboardRewards,
  applyPendingConfigIfNeeded,
  getRewardHistory
};
