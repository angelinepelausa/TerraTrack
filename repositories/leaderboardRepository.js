import firestore from '@react-native-firebase/firestore';

const toTimestamp = (value) => {
  if (!value) return null;
  return value.toDate ? value : firestore.Timestamp.fromDate(value);
};

export const calculateNextCycleEnd = (frequency) => {
  const now = new Date();

  switch (frequency) {
    case 'daily': {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return firestore.Timestamp.fromDate(end);
    }
    case 'weekly': {
      const end = new Date(now);
      const day = end.getDay(); 
      const daysUntilSaturday = 6 - day;
      end.setDate(end.getDate() + daysUntilSaturday);
      end.setHours(23, 59, 59, 999);
      return firestore.Timestamp.fromDate(end);
    }
    case 'monthly': {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return firestore.Timestamp.fromDate(end);
    }
    default: {
      const end = new Date(now);
      const day = end.getDay();
      const daysUntilSaturday = 6 - day;
      end.setDate(end.getDate() + daysUntilSaturday);
      end.setHours(23, 59, 59, 999);
      return firestore.Timestamp.fromDate(end);
    }
  }
};

export const applyPendingConfigIfNeeded = async () => {
  const docRef = firestore().collection('leaderboardConfig').doc('config');
  const doc = await docRef.get();
  if (!doc.exists) return;

  const data = doc.data();
  if (!data.currentCycleEnd) return; 
  const now = new Date();
  const cycleEnd = toTimestamp(data.currentCycleEnd).toDate();

  if (data.pendingConfig && cycleEnd <= now) {
    const updated = {
      ...data.pendingConfig,
      lastApplied: firestore.Timestamp.fromDate(now),
    };

    await docRef.set({
      ...updated,
      pendingConfig: firestore.FieldValue.delete(),
      currentCycleEnd: calculateNextCycleEnd(updated.resetFrequency),
    }, { merge: true });
  }
};

export const getLeaderboardConfig = async () => {
  const docRef = firestore().collection('leaderboardConfig').doc('config');
  const doc = await docRef.get();

  if (!doc.exists) {
    const defaultConfig = {
      status: 'active',
      resetFrequency: 'weekly',
      rewards: {
        top1: { terraCoins: 0, terraPoints: 0 },
        top2: { terraCoins: 0, terraPoints: 0 },
        top3: { terraCoins: 0, terraPoints: 0 },
        top4to10: { terraCoins: 0, terraPoints: 0 },
        top11plus: { terraCoins: 0, terraPoints: 0 },
      },
      currentCycleEnd: null, 
      pendingConfig: null,
    };
    await docRef.set(defaultConfig);
    return defaultConfig;
  }

  const data = doc.data();
  return data;
};

export const savePendingLeaderboardConfig = async (config) => {
  const docRef = firestore().collection('leaderboardConfig').doc('config');

  await applyPendingConfigIfNeeded();

  const doc = await docRef.get();
  const now = new Date();

  if (!doc.exists) {
    await docRef.set({
      ...config,
      currentCycleEnd: calculateNextCycleEnd(config.resetFrequency),
      pendingConfig: null,
    });
  } else {
    const data = doc.data();
    const cycleEnd = toTimestamp(data.currentCycleEnd)?.toDate();

    if (!data.currentCycleEnd || cycleEnd <= now) {
      await docRef.set({
        ...config,
        currentCycleEnd: calculateNextCycleEnd(config.resetFrequency),
        pendingConfig: firestore.FieldValue.delete(),
      }, { merge: true });
    } else {
      await docRef.set({
        pendingConfig: config,
      }, { merge: true });
    }
  }
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
