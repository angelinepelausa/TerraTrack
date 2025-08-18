import firestore from '@react-native-firebase/firestore';

export const tasksRepository = {
  getAllTasks: async () => {
    try {
      const snapshot = await firestore().collection('tasks').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  getEasyTasks: async () => {
    try {
      const snapshot = await firestore()
        .collection('tasks')
        .where('difficulty', '==', 'easy')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching easy tasks:', error);
      throw error;
    }
  },

  getHardTasks: async () => {
    try {
      const snapshot = await firestore()
        .collection('tasks')
        .where('difficulty', '==', 'hard')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching hard tasks:', error);
      throw error;
    }
  },
};
