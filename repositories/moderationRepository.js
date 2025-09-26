// repositories/moderationRepository.js
import firestore from "@react-native-firebase/firestore";
import { populateUserData } from "./userRepository";

const forReviewCollection = firestore().collection("forReview").doc("posts").collection("items");
const usersCollection = firestore().collection("users");
const moderationActionsCollection = firestore().collection("moderationActions");
const communityProgressCollection = (quarter) => 
  firestore().collection("community_progress").doc(quarter).collection("community_comments");

export const moderationRepository = {
  // Fetch posts for review and map userId to username
  getForReviewPosts: async () => {
    const snapshot = await forReviewCollection.get();

    const data = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const postData = doc.data();
        
        let username = "Unknown User";
        if (postData.originalData?.userId) {
          const userInfo = await populateUserData(postData.originalData.userId);
          username = userInfo.username;
        }

        return {
          id: doc.id,
          username,
          ...postData,
        };
      })
    );

    return data;
  },

  // Real-time listener for report updates
  getReportRealTimeListener: (reportId, onUpdate, onError) => {
    const unsubscribe = forReviewCollection.doc(reportId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const reportData = { 
              id: doc.id, 
              ...doc.data() 
            };
            onUpdate(reportData);
          } else {
            onError(new Error("Report not found"));
          }
        },
        (error) => {
          console.error("Error in real-time listener:", error);
          if (onError) onError(error);
        }
      );
    
    return unsubscribe;
  },

  // Update the status of a post/report
  updatePostStatus: async (itemId, data) => {
    return forReviewCollection.doc(itemId).update(data);
  },

  // Delete a post/report
  deletePost: async (itemId) => {
    return forReviewCollection.doc(itemId).delete();
  },

  // Get user data
  getUserData: async (userId) => {
    const doc = await usersCollection.doc(userId).get();
    return doc.exists ? doc.data() : null;
  },

  // Update user suspension data
  updateUserSuspensionData: async (userId, suspendedCount, status, suspensionStart, suspensionEnd, suspensionReason) => {
    const updateData = {
      suspendedCount,
      status,
      lastActionAt: firestore.FieldValue.serverTimestamp(),
    };

    if (suspensionStart) {
      updateData.suspensionStart = suspensionStart;
    }

    if (suspensionEnd) {
      updateData.suspensionEnd = suspensionEnd;
    }

    if (suspensionReason) {
      updateData.suspensionReason = suspensionReason;
    }

    return usersCollection.doc(userId).update(updateData);
  },

  // Update community_progress document (for markAsSafe - only update fields)
  updateCommunityProgress: async (quarter, itemId, updates) => {
    return communityProgressCollection(quarter).doc(itemId).update(updates);
  },

  // DELETE from community_progress (for suspendUser - complete deletion)
  deleteFromCommunityProgress: async (quarter, itemId) => {
    return communityProgressCollection(quarter).doc(itemId).delete();
  },

  // Update user's suspended count (legacy method, use updateUserSuspensionData instead)
  updateUserSuspendedCount: async (userId) => {
    return usersCollection.doc(userId).update({
      suspendedCount: firestore.FieldValue.increment(1),
      lastSuspendedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Log moderation action for accountability
  logModerationAction: async (actionData) => {
    return moderationActionsCollection.add({
      ...actionData,
      timestamp: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Get moderation actions for a specific item
  getModerationActions: async (itemId) => {
    const snapshot = await moderationActionsCollection
      .where("itemId", "==", itemId)
      .orderBy("timestamp", "desc")
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};