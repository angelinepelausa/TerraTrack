import { useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { avatarsRepository } from '../repositories/avatarsRepository';
import { statsRepository } from '../repositories/statsRepository';
import { statsService } from '../services/statsService';

export const useProfile = () => {
  const [userData, setUserData] = useState(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) return;

    const unsubscribeAvatar = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot(doc => {
        const data = doc.data();
        setUserData(data);

        if (data?.avatar) fetchAvatarUrl(data.avatar);
        else setCurrentAvatarUrl(null);
      });

    return () => unsubscribeAvatar();
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
    userId,
    setUserData
  };
};