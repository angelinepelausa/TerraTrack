import firestore from '@react-native-firebase/firestore';

export const badgeService = {
  async getBadgeDetails(badgeId) {
    try {
      const badgeDoc = await firestore().collection('badges').doc(badgeId).get();
      if (badgeDoc.exists) {
        return {
          id: badgeDoc.id,
          ...badgeDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching badge details:', error);
      throw error;
    }
  },

  async navigateToBadgeDetail(navigation, badge) {
    try {
      const completeBadgeData = await this.getBadgeDetails(badge.id);
      if (completeBadgeData) {
        navigation.navigate('AchievementDetailScreen', { 
          currentBadge: completeBadgeData 
        });
      }
    } catch (error) {
      console.error('Error navigating to badge detail:', error);
      throw error;
    }
  }
};