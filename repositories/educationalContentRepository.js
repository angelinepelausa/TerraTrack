import firestore from '@react-native-firebase/firestore';

export const getContent = async (contentId) => {
  try {
    const document = await firestore()
      .collection('educational_content')
      .doc(contentId)
      .get();

    if (document.exists) {
      return { id: document.id, ...document.data() };
    } else {
      throw new Error('Educational content not found');
    }
  } catch (error) {
    console.error('Error fetching educational content:', error);
    throw error;
  }
};

export const getAllContent = async () => {
  try {
    const snapshot = await firestore()
      .collection('educational_content')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all educational content:', error);
    throw error;
  }
};

export const subscribeToContent = (callback) => {
  const unsubscribe = firestore()
    .collection('educational_content')
    .orderBy('lastUpdated', 'desc')
    .onSnapshot(
      (snapshot) => {
        const contentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(contentData);
      },
      (error) => {
        console.error('Error in real-time listener:', error);
        callback([], error);
      }
    );

  return unsubscribe;
};

export const addContent = async (data) => {
  try {
    const docRef = await firestore().collection('educational_content').add(data);
    return docRef.id;
  } catch (error) {
    console.error('Error adding educational content:', error);
    throw error;
  }
};

export const updateContent = async (contentId, data) => {
  try {
    await firestore()
      .collection('educational_content')
      .doc(contentId)
      .update({
        ...data,
        lastUpdated: firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error('Error updating educational content:', error);
    throw error;
  }
};

export const deleteContent = async (contentId) => {
  try {
    await firestore()
      .collection('educational_content')
      .doc(contentId)
      .delete();
  } catch (error) {
    console.error('Error deleting educational content:', error);
    throw error;
  }
};

export const educationalContentRepository = {
  getContent,
  getAllContent,
  subscribeToContent, 
  addContent,
  updateContent,
  deleteContent
};