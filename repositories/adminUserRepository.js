import firestore from '@react-native-firebase/firestore';

// --- Helper: fetch username and avatar for a user ---
const populateUserData = async (userId) => {
  let username = "Unknown User";
  let avatar = null;

  if (!userId) return { username, avatar };

  try {
    const userDoc = await firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) return { username, avatar };

    const userData = userDoc.data();
    username = userData.username || username;

    if (userData.avatar) {
      const avatarDoc = await firestore().collection('avatars').doc(userData.avatar).get();
      if (avatarDoc.exists) avatar = avatarDoc.data()?.imageurl || null;
    }
  } catch (err) {
    console.warn('populateUserData error:', err);
  }

  return { username, avatar };
};

export const adminUserRepository = {
  // Get basic user data
  async getUserBasicData(userId) {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const { username, avatar } = await populateUserData(userId);
        return { 
          id: userId, 
          ...userData,
          username,
          avatar
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user basic data:', error);
      throw error;
    }
  },

  // Get user preferences
  async getUserPreferences(userId) {
    try {
      const prefsDoc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('onboarding')
        .doc('preferences')
        .get();
      
      return prefsDoc.exists ? prefsDoc.data() : {};
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return {};
    }
  },

  // Get user stats
  async getUserStats(userId) {
    try {
      const statsDoc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('total')
        .doc('stats')
        .get();
      
      return statsDoc.exists ? statsDoc.data() : {};
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {};
    }
  },

  async getUnlockedBadges(userId) {
    try {
        const badgesSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('unlockedBadges')
        .get();
        
        const unlockedBadges = badgesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        unlockedAt: doc.data().unlockedAt 
        }));
        
        // Get full badge details from badges collection
        const badgeDetails = [];
        for (const unlockedBadge of unlockedBadges) {
        try {
            const badgeDoc = await firestore().collection('badges').doc(unlockedBadge.id).get();
            if (badgeDoc.exists) {
            const badgeData = badgeDoc.data();
            badgeDetails.push({
                id: unlockedBadge.id,
                name: badgeData.name,
                description: badgeData.description,
                imageUrl: badgeData.imageUrl || badgeData.imageurl,
                category: badgeData.category,
                targetNumber: badgeData.targetNumber,
                unlockedAt: unlockedBadge.unlockedAt
            });
            }
        } catch (error) {
            console.error('Error fetching badge details for', unlockedBadge.id, error);
        }
        }
        
        return badgeDetails;
    } catch (error) {
        console.error('Error fetching unlocked badges:', error);
        return [];
    }
    },

    // Get purchased avatars with full avatar details
    async getPurchasedAvatars(userId) {
    try {
        const avatarsDoc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('purchases')
        .doc('avatars')
        .get();
        
        if (!avatarsDoc.exists) {
        return [];
        }

        const purchasedAvatars = avatarsDoc.data();
        
        if (!purchasedAvatars || !purchasedAvatars.list || !Array.isArray(purchasedAvatars.list)) {
        return [];
        }

        const avatarDetails = [];

        for (const avatarId of purchasedAvatars.list) {
        if (avatarId && typeof avatarId === 'string') {
            try {
            const avatarDoc = await firestore().collection('avatars').doc(avatarId).get();
            if (avatarDoc.exists) {
                const avatarData = avatarDoc.data();
                avatarDetails.push({ 
                id: avatarId,
                name: avatarData.name,
                description: avatarData.description,
                imageUrl: avatarData.imageUrl || avatarData.imageurl,
                price: avatarData.price,
                category: avatarData.category
                });
            }
            } catch (avatarError) {
            console.error('Error loading avatar', avatarId, ':', avatarError);
            }
        }
        }

        return avatarDetails;
    } catch (error) {
        console.error('Error fetching purchased avatars:', error);
        return [];
    }
    },

  // Get invites with invited user details
  async getUserInvites(userId) {
    try {
      const invitesSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('invites')
        .get();
      
      const invites = invitesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      const invitesWithDetails = [];
      for (const invite of invites) {
        try {
          const invitedUserDoc = await firestore().collection('users').doc(invite.id).get();
          if (invitedUserDoc.exists) {
            const invitedUserData = invitedUserDoc.data();
            invitesWithDetails.push({
              ...invite,
              invitedUsername: invitedUserData.username || 'Unknown User',
              invitedUserEmail: invitedUserData.email || 'No email'
            });
          }
        } catch (error) {
          invitesWithDetails.push({
            ...invite,
            invitedUsername: 'Error Loading User',
            invitedUserEmail: 'No email'
          });
        }
      }
      
      return invitesWithDetails;
    } catch (error) {
      console.error('Error fetching user invites:', error);
      return [];
    }
  },

  // Update user status
  async updateUserStatus(userId, status) {
    try {
      await firestore().collection('users').doc(userId).update({
        status: status
      });
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Suspend user with duration (NO suspend count increment)
  async suspendUser(userId, durationDays) {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentSuspendCount = userData.suspendedCount || 0;

      // Calculate suspension times
      const suspensionStart = firestore.FieldValue.serverTimestamp();
      const now = new Date();
      const endTime = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
      const suspensionEnd = firestore.Timestamp.fromDate(endTime);

      // Update user data (keep current suspend count)
      await firestore().collection('users').doc(userId).update({
        status: 'suspended',
        suspendedCount: currentSuspendCount, // Keep the same count
        suspensionStart: suspensionStart,
        suspensionEnd: suspensionEnd,
        suspensionReason: `Admin suspension: ${durationDays} day(s)`,
        lastActionAt: firestore.FieldValue.serverTimestamp()
      });

      // Log moderation action
      await firestore().collection('moderationActions').add({
        targetUserId: userId,
        action: 'admin_suspension',
        durationDays: durationDays,
        suspendCount: currentSuspendCount,
        timestamp: firestore.FieldValue.serverTimestamp(),
        details: {
          type: 'manual',
          previousStatus: userData.status,
          adminId: 'admin_dashboard'
        }
      });

      return true;
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  },

  // Ban user (NO suspend count increment)
  async banUser(userId) {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentSuspendCount = userData.suspendedCount || 0;

      // Update user data (keep current suspend count)
      await firestore().collection('users').doc(userId).update({
        status: 'banned',
        suspendedCount: currentSuspendCount, // Keep the same count
        suspensionReason: 'Permanent ban by admin',
        lastActionAt: firestore.FieldValue.serverTimestamp()
      });

      // Log moderation action
      await firestore().collection('moderationActions').add({
        targetUserId: userId,
        action: 'admin_ban',
        suspendCount: currentSuspendCount,
        timestamp: firestore.FieldValue.serverTimestamp(),
        details: {
          previousStatus: userData.status,
          adminId: 'admin_dashboard'
        }
      });

      return true;
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  },

  // Activate user
  async activateUser(userId) {
    try {
      await firestore().collection('users').doc(userId).update({
        status: 'active',
        suspensionStart: null,
        suspensionEnd: null,
        suspensionReason: null,
        lastActionAt: firestore.FieldValue.serverTimestamp()
      });

      // Log moderation action
      await firestore().collection('moderationActions').add({
        targetUserId: userId,
        action: 'admin_activation',
        timestamp: firestore.FieldValue.serverTimestamp(),
        details: {
          adminId: 'admin_dashboard'
        }
      });

      return true;
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  },

  // Get all user data at once
  async getUserFullData(userId) {
    try {
      const [
        basicData,
        preferences,
        stats,
        unlockedBadges,
        purchasedAvatars,
        invites
      ] = await Promise.all([
        this.getUserBasicData(userId),
        this.getUserPreferences(userId),
        this.getUserStats(userId),
        this.getUnlockedBadges(userId),
        this.getPurchasedAvatars(userId),
        this.getUserInvites(userId)
      ]);

      return {
        ...basicData,
        preferences,
        stats,
        unlockedBadges,
        purchasedAvatars,
        invites
      };
    } catch (error) {
      console.error('Error fetching full user data:', error);
      throw error;
    }
  }
};