import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { avatarsRepository } from '../repositories/avatarsRepository';

export const useUserProfile = (userId) => {
  const [userData, setUserData] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot(doc => {
        const data = doc.data();
        setUserData(data);

        if (data?.avatar) fetchAvatarUrl(data.avatar);
        else setCurrentAvatarUrl(null);
      });

    return () => unsubscribe();
  }, [userId]);

  const fetchAvatarUrl = async (avatarId) => {
    if (!avatarId) return;
    try {
      const avatarDoc = await avatarsRepository.getAvatarById(avatarId);
      if (avatarDoc?.imageurl) setCurrentAvatarUrl(avatarDoc.imageurl);
      else setCurrentAvatarUrl(null);
    } catch (err) {
      console.error('Error fetching avatar image:', err);
      setCurrentAvatarUrl(null);
    }
  };

  return {
    userData,
    currentAvatarUrl,
  };
};
