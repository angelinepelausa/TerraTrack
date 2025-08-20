import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const hasAttemptedQuiz = async (contentId) => {
  const user = auth().currentUser;
  if (!user) throw new Error('User not logged in');
  const userId = user.uid;

  const attemptsRef = firestore()
    .collection('users')
    .doc(userId)
    .collection('quiz_attempts');

  const snapshot = await attemptsRef.where('contentId', '==', contentId).get();
  return !snapshot.empty; 
};

export const saveQuizAttempt = async ({
  contentId,
  correctAnswers,
  totalQuestions,
  coinsEarned,
  pointsEarned,
  timeTaken,
}) => {
  const user = auth().currentUser;
  if (!user) throw new Error('User not logged in');
  const userId = user.uid;

  const attemptsRef = firestore()
    .collection('users')
    .doc(userId)
    .collection('quiz_attempts');

  const querySnapshot = await attemptsRef
    .where('contentId', '==', contentId)
    .limit(1)
    .get();

  const attemptData = {
    contentId,
    type: 'educational',
    date: firestore.FieldValue.serverTimestamp(),
    correctAnswers,
    totalQuestions,
    coinsEarned,
    pointsEarned,
    timeTaken,
  };

  if (!querySnapshot.empty) {
    const docId = querySnapshot.docs[0].id;
    await attemptsRef.doc(docId).update(attemptData);
    return docId;
  } else {
    const docRef = await attemptsRef.add(attemptData);
    return docRef.id;
  }
};