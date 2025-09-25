import firestore from "@react-native-firebase/firestore";

const forReviewCollection = firestore().collection("forReview").doc("posts").collection("items");
const usersCollection = firestore().collection("users");

export const moderationRepository = {
  // Fetch posts for review and map userId to username
  getForReviewPosts: async () => {
    const snapshot = await forReviewCollection.get();

    // Map userId → username
    const data = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const postData = doc.data();
        let username = "Unknown";

        if (postData.userId) {
          const userDoc = await usersCollection.doc(postData.userId).get();
          if (userDoc.exists) {
            username = userDoc.data().username || "Unknown";
          }
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

  // Update the status of a post/report
  updatePostStatus: async (itemId, data) => {
    return forReviewCollection.doc(itemId).update(data);
  },

  // Delete a post/report
  deletePost: async (itemId) => {
    return forReviewCollection.doc(itemId).delete();
  },

  // Update user warnings and status
  updateUserWarnings: async (userId, warnings, status) => {
    return usersCollection.doc(userId).update({
      warnings,
      status,
      lastActionAt: firestore.FieldValue.serverTimestamp(),
    });
  },
};
