import firestore from '@react-native-firebase/firestore';

const badgesCollection = firestore().collection('badges');

export const badgesRepository = {
  addBadge: async (badgeData) => {
    try {
      const docRef = await badgesCollection.add(badgeData);
      return docRef.id;
    } catch (err) {
      console.error('Error adding badge:', err);
      throw err;
    }
  },

  updateBadge: async (id, badgeData) => {
    try {
      await badgesCollection.doc(id).update(badgeData);
    } catch (err) {
      console.error('Error updating badge:', err);
      throw err;
    }
  },

  getAllBadges: async () => {
    try {
      const snapshot = await badgesCollection.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching badges:', err);
      throw err;
    }
  },

  getBadgeById: async (badgeId) => {
    try {
      const badgeDoc = await badgesCollection.doc(badgeId).get();
      if (badgeDoc.exists) {
        return { id: badgeDoc.id, ...badgeDoc.data() };
      } else {
        console.warn('Badge not found:', badgeId);
        return null;
      }
    } catch (err) {
      console.error('Error fetching badge:', err);
      return null;
    }
  },

  deleteBadge: async (id) => {
    try {
      await badgesCollection.doc(id).delete();
    } catch (err) {
      console.error('Error deleting badge:', err);
      throw err;
    }
  },

  getBadgesByCategorySorted: async (category) => {
    try {
      const allBadges = await badgesCollection.get();
      const badges = allBadges.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return badges
        .filter(b => b.category.toLowerCase() === category.toLowerCase())
        .sort((a, b) => a.targetNumber - b.targetNumber); 
    } catch (err) {
      console.error('Error fetching badges by category:', err);
      throw err;
    }
  },

  unlockBadgeForUser: async (userId, badgeId) => {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('unlockedBadges')
        .doc(badgeId)
        .set({
          unlockedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
      console.error('Error unlocking badge for user:', err);
      throw err;
    }
  },


  getUnlockedBadgesForUser: async (userId) => {
    try {
      const snapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('unlockedBadges')
        .get();

      const unlocked = {};
      snapshot.forEach((doc) => {
        unlocked[doc.id] = true;
      });
      return unlocked;
    } catch (err) {
      console.error('Error fetching unlocked badges for user:', err);
      return {};
    }
  },
};
