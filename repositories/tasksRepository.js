import firestore from '@react-native-firebase/firestore';

export const tasksRepository = {
  getAllTasks: async () => {
    try {
      const snapshot = await firestore().collection('tasks').get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        imageUrl: doc.data().imageurl || null,
      }));
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
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        imageUrl: doc.data().imageurl || null,
      }));
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
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        imageUrl: doc.data().imageurl || null, 
      }));
    } catch (error) {
      console.error('Error fetching hard tasks:', error);
      throw error;
    }
  },

  addTask: async (task) => {
    try {
      const docRef = await firestore().collection('tasks').add(task);
      return docRef.id;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  updateTask: async (id, updatedTask) => {
    try {
      await firestore().collection('tasks').doc(id).update(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      await firestore().collection('tasks').doc(id).delete();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },
};
