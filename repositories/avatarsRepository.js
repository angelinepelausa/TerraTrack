import firestore from '@react-native-firebase/firestore';

const avatarsCollection = firestore().collection('avatars');

export const avatarsRepository = {
  addAvatar: async (avatarData) => {
    try {
      const docRef = await avatarsCollection.add(avatarData);
      return docRef.id;
    } catch (err) {
      console.error('Error adding avatar:', err);
      throw err;
    }
  },

  updateAvatar: async (id, avatarData) => {
    try {
      await avatarsCollection.doc(id).update(avatarData);
    } catch (err) {
      console.error('Error updating avatar:', err);
      throw err;
    }
  },

  getAllAvatars: async () => {
    try {
      const snapshot = await avatarsCollection.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching avatars:', err);
      throw err;
    }
  },

  deleteAvatar: async (id) => {
    try {
      await avatarsCollection.doc(id).delete();
    } catch (err) {
      console.error('Error deleting avatar:', err);
      throw err;
    }
  },

  getAvatarById: async (avatarId) => {
    try {
      const avatarDoc = await avatarsCollection.doc(avatarId).get();
      if (avatarDoc.exists) {
        return { id: avatarDoc.id, ...avatarDoc.data() };
      } else {
        console.warn('Avatar not found:', avatarId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
      return null;
    }
  },
};
