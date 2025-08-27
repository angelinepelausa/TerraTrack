import firestore from '@react-native-firebase/firestore';

const COLLECTION = 'weekly_quizzes';

export const getQuiz = async (quizId) => {
  try {
    const document = await firestore()
      .collection(COLLECTION)
      .doc(quizId)
      .get();

    if (document.exists) {
      return { id: document.id, ...document.data() };
    } else {
      throw new Error('Weekly quiz not found');
    }
  } catch (error) {
    console.error('Error fetching weekly quiz:', error);
    throw error;
  }
};

export const getAllQuizzes = async () => {
  try {
    const snapshot = await firestore().collection(COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all weekly quizzes:', error);
    throw error;
  }
};

export const addQuiz = async (id, data) => {
  try {
    await firestore().collection(COLLECTION).doc(id).set(data);
    return id;
  } catch (error) {
    console.error('Error adding weekly quiz:', error);
    throw error;
  }
};

export const updateQuiz = async (id, data) => {
  try {
    await firestore().collection(COLLECTION).doc(id).update(data);
  } catch (error) {
    console.error('Error updating weekly quiz:', error);
    throw error;
  }
};

export const deleteQuiz = async (quizId) => {
  try {
    await firestore().collection(COLLECTION).doc(quizId).delete();
  } catch (error) {
    console.error('Error deleting weekly quiz:', error);
    throw error;
  }
};

export const weeklyQuizRepository = {
  getQuiz,
  getAllQuizzes,
  addQuiz,
  updateQuiz,
  deleteQuiz,
};
