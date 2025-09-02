// repositories/leaderboardRepository.js
import firestore from '@react-native-firebase/firestore';
import { computeWeeklyCycle } from '../utils/leaderboardUtils';
import { addUserRewards } from './userRepository';

const CONFIG_DOC = firestore().collection('leaderboard').doc('config');
const RESULTS_COLLECTION = firestore().collection('leaderboard').doc('results');

// ----------------- CONFIG -----------------

/**
 * Get current leaderboard config from Firestore.
 * If none exists, create a default one.
 */
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

/**
 * Save or update pending leaderboard config.
 * - If no pending exists → create new pending.
 * - If pending exists → update it with new rewards.
 */
export const saveOrUpdatePendingConfig = async (rewards) => {
  const currentConfig = await getLeaderboardConfig();

  const pendingConfig = currentConfig.pendingConfig
    ? { ...currentConfig.pendingConfig, rewards, savedAt: firestore.Timestamp.now() }
    : { rewards, savedAt: firestore.Timestamp.now() };

  await CONFIG_DOC.set({ pendingConfig }, { merge: true });
};

/**
 * Delete pending configuration entirely.
 */
export const deletePendingConfig = async () => {
  await CONFIG_DOC.set({ pendingConfig: null }, { merge: true });
};

// ----------------- LEADERBOARD DISPLAY -----------------

/**
 * Get top N users for leaderboard display
 */
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

/**
 * Get user's current rank
 */
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

// ----------------- LEADERBOARD REWARDS -----------------

/**
 * Get ALL users for reward distribution
 */
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

/**
 * Distribute rewards to ALL users and save results
 */
export const distributeLeaderboardRewards = async () => {
  try {
    const config = await getLeaderboardConfig();
    const allUsers = await getAllUsers(); // Get ALL users
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

    // Distribute rewards to ALL users based on rank
    for (const user of allUsers) {
      let rewardConfig;

      if (user.rank === 1) rewardConfig = config.rewards.top1;
      else if (user.rank === 2) rewardConfig = config.rewards.top2;
      else if (user.rank === 3) rewardConfig = config.rewards.top3;
      else if (user.rank >= 4 && user.rank <= 10) rewardConfig = config.rewards.top4to10;
      else rewardConfig = config.rewards.top11plus;

      // Add rewards to EVERY user
      await addUserRewards(user.id, rewardConfig.terraCoins, rewardConfig.terraPoints);
      
      results.rewards.push({
        userId: user.id,
        username: user.username,
        rank: user.rank,
        terraCoins: rewardConfig.terraCoins,
        terraPoints: rewardConfig.terraPoints,
        previousTerraPoints: user.terraPoints
      });

      results.totalTerraCoinsDistributed += rewardConfig.terraCoins;
      results.totalTerraPointsDistributed += rewardConfig.terraPoints;
    }

    // Save results to history
    await RESULTS_COLLECTION.collection('history').add(results);

    return { success: true, results };

  } catch (error) {
    console.error('Error distributing rewards:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Apply pending config and distribute rewards if new cycle
 */
export const applyPendingConfigIfNeeded = async () => {
  const { start } = computeWeeklyCycle(); // current Sunday start
  const config = await getLeaderboardConfig();

  // If already applied this cycle, do nothing
  if (
    config.lastAppliedCycleStart &&
    config.lastAppliedCycleStart.toMillis &&
    new Date(config.lastAppliedCycleStart.toMillis()).getTime() === start.getTime()
  ) {
    return { applied: false, reason: 'Already applied this cycle' };
  }

  let appliedConfig = config.rewards;

  // Apply pending if exists
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
    // No pending → just mark cycle as updated
    await CONFIG_DOC.set(
      {
        lastAppliedCycleStart: firestore.Timestamp.fromDate(start),
      },
      { merge: true }
    );
  }

  // Distribute rewards to ALL users for the completed cycle
  const distributionResult = await distributeLeaderboardRewards();

  return { 
    applied: true, 
    config: appliedConfig,
    distribution: distributionResult
  };
};

/**
 * Get reward history
 */
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

/**
 * MANUAL REWARD DISTRIBUTION - Call this from your admin panel
 * This will reward ALL users regardless of cycle timing
 */
export const manuallyDistributeRewards = async () => {
  try {
    const config = await getLeaderboardConfig();
    const allUsers = await getAllUsers();
    const now = firestore.Timestamp.now();
    
    const results = {
      distributedAt: now,
      rewards: [],
      totalUsers: allUsers.length,
      totalTerraCoinsDistributed: 0,
      totalTerraPointsDistributed: 0,
      manualDistribution: true
    };

    // Distribute rewards to ALL users
    for (const user of allUsers) {
      let rewardConfig;

      if (user.rank === 1) rewardConfig = config.rewards.top1;
      else if (user.rank === 2) rewardConfig = config.rewards.top2;
      else if (user.rank === 3) rewardConfig = config.rewards.top3;
      else if (user.rank >= 4 && user.rank <= 10) rewardConfig = config.rewards.top4to10;
      else rewardConfig = config.rewards.top11plus;

      await addUserRewards(user.id, rewardConfig.terraCoins, rewardConfig.terraPoints);
      
      results.rewards.push({
        userId: user.id,
        username: user.username,
        rank: user.rank,
        terraCoins: rewardConfig.terraCoins,
        terraPoints: rewardConfig.terraPoints
      });

      results.totalTerraCoinsDistributed += rewardConfig.terraCoins;
      results.totalTerraPointsDistributed += rewardConfig.terraPoints;
    }

    // Save manual distribution results
    await RESULTS_COLLECTION.collection('manual_distributions').add(results);

    return { success: true, results };

  } catch (error) {
    console.error('Error in manual reward distribution:', error);
    return { success: false, error: error.message };
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
  getRewardHistory,
  manuallyDistributeRewards
};