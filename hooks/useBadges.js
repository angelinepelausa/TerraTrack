import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';

export const useBadges = (userId) => {
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [displayedBadges, setDisplayedBadges] = useState([]);
  const [badgeEditMode, setBadgeEditMode] = useState(false);
  const [tempDisplayedBadges, setTempDisplayedBadges] = useState([]);

  useEffect(() => {
    if (!userId) return;
    
    const unsubscribeBadges = firestore()
      .collection('users')
      .doc(userId)
      .collection('unlockedBadges')
      .onSnapshot(async (snapshot) => {
        if (snapshot.empty) {
          setUnlockedBadges([]);
          setDisplayedBadges([]);
          return;
        }

        const badgePromises = snapshot.docs.map(async doc => {
          const badgeId = doc.id;
          const badgeDoc = await firestore().collection('badges').doc(badgeId).get();
          if (badgeDoc.exists) {
            const badgeData = badgeDoc.data();
            return {
              id: badgeId,
              imageurl: badgeData?.imageurl,
              unlockedAt: doc.data()?.unlockedAt || null
            };
          }
          return null;
        });

        const badges = (await Promise.all(badgePromises)).filter(badge => badge != null);
        
        badges.sort((a, b) => {
          if (!a.unlockedAt && !b.unlockedAt) return 0;
          if (!a.unlockedAt) return 1;
          if (!b.unlockedAt) return -1;
          return b.unlockedAt.toDate().getTime() - a.unlockedAt.toDate().getTime();
        });

        setUnlockedBadges(badges);
        
        if (!badgeEditMode) {
          setDisplayedBadges(badges.slice(0, 3));
        }
      });

    return () => unsubscribeBadges();
  }, [userId, badgeEditMode]);

  const enterBadgeEditMode = () => {
    setTempDisplayedBadges([...displayedBadges]);
    setBadgeEditMode(true);
  };

  const cancelBadgeEdit = () => {
    setTempDisplayedBadges([]);
    setBadgeEditMode(false);
  };

  const saveDisplayedBadges = async () => {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          displayedBadges: tempDisplayedBadges.map(badge => badge.id)
        });
      
      setDisplayedBadges([...tempDisplayedBadges]);
      setBadgeEditMode(false);
      setTempDisplayedBadges([]);
      return true;
    } catch (err) {
      console.error('Error saving displayed badges:', err);
      throw err;
    }
  };

  const toggleBadgeSelection = (badge) => {
    if (!badgeEditMode) return;

    const isCurrentlySelected = tempDisplayedBadges.some(b => b.id === badge.id);
    
    if (isCurrentlySelected) {
      setTempDisplayedBadges(tempDisplayedBadges.filter(b => b.id !== badge.id));
    } else {
      if (tempDisplayedBadges.length < 3) {
        setTempDisplayedBadges([...tempDisplayedBadges, badge]);
      }
    }
  };

  return {
    unlockedBadges,
    displayedBadges,
    badgeEditMode,
    tempDisplayedBadges,
    enterBadgeEditMode,
    cancelBadgeEdit,
    saveDisplayedBadges,
    toggleBadgeSelection
  };
};