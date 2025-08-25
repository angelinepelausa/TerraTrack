import { tasksRepository } from '../repositories/tasksRepository';
import firestore from '@react-native-firebase/firestore';
import { uploadImageToCloudinary } from './cloudinary';
import { addUserRewards } from '../repositories/userRepository';

export const taskService = {
  fetchTasks: async () => {
    const [easy, hard] = await Promise.all([
      tasksRepository.getEasyTasks(),
      tasksRepository.getHardTasks(),
    ]);
    return { easy, hard };
  },

  verifyTasks: async (userId, selectedTasks, photoUris = []) => {
    const today = new Date().toISOString().split('T')[0];

    const tasksFinishedRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('tasks_finished')
      .doc(today);

    const verificationsRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('verifications')
      .doc(today);

    const batch = firestore().batch();

    for (let index = 0; index < selectedTasks.length; index++) {
      const task = selectedTasks[index];
      const isFirst3 = index < 3;
      let photoUrl = null;

      if (isFirst3 && photoUris[index]) {
        photoUrl = await uploadImageToCloudinary(photoUris[index]);
        console.log('Uploaded to Cloudinary:', photoUrl);
      }

      batch.set(
        tasksFinishedRef,
        {
          [task.id]: {
            pointsEarned: 10,
            coinsEarned: 1,
            finishedAt: firestore.FieldValue.serverTimestamp(),
            photoUrl: photoUrl || null,
          },
        },
        { merge: true }
      );

      batch.set(
        verificationsRef,
        {
          [task.id]: {
            photoUrl: photoUrl || null,
            status: 'pending',
            verifiedBy: '',
            submittedAt: firestore.FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );
    }

    await batch.commit();

    await addUserRewards(userId, selectedTasks.length, selectedTasks.length * 10);
  },
};
