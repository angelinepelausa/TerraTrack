import firestore from "@react-native-firebase/firestore"; 

const reportsCollection = firestore().collection("reports"); 

const userReportsCollection = (userId) => firestore().collection("users").doc(userId).collection("reports"); 

const getYearQuarter = () => { 
  const now = new Date(); 
  const year = now.getFullYear(); 
  const quarter = Math.floor(now.getMonth() / 3) + 1; 
  return `${year}-Q${quarter}`; 
}; 

export const reportRepository = {
  submitReport: async (itemId, itemType, userId, category, subType, parentCommentId = null) => {
    try {
      const existing = await reportsCollection
        .where("itemId", "==", itemId)
        .where("userId", "==", userId)
        .get();
      if (!existing.empty) {
        throw new Error("You have already reported this item.");
      }

      await userReportsCollection(userId).doc(itemId).set({
        hidden: true,
        reported: true,
        timestamp: firestore.FieldValue.serverTimestamp(),
        itemType,
        itemId,
        userId,
      });

      await reportsCollection.add({
        itemId,
        itemType,
        userId,
        category,
        subType,
        timestamp: firestore.FieldValue.serverTimestamp(),
        parentCommentId: parentCommentId || null,
      });

      try {
        const itemRef = getItemRef(itemId, itemType, parentCommentId);
        const snapshot = await itemRef.get();
        if (snapshot.exists) {
          const currentReports = snapshot.data().totalReports || 0;
          const newReports = currentReports + 1;
          console.log(`Updating reports: ${currentReports} -> ${newReports} for ${itemType} ${itemId}`);
          await itemRef.update({ totalReports: newReports });

          if (newReports >= 3) {
            console.log(`Item reached 3 reports, adding to forReview: ${itemId}`);
            await itemRef.update({ hidden: true });
            
            const reportsSnapshot = await reportsCollection
              .where("itemId", "==", itemId)
              .orderBy("timestamp", "asc")
              .limit(3)
              .get();
            
            const reporters = [];
            reportsSnapshot.forEach(doc => {
              const reportData = doc.data();
              reporters.push({
                userId: reportData.userId,
                category: reportData.category,
                subType: reportData.subType,
                timestamp: reportData.timestamp,
                reportId: doc.id
              });
            });

            const forReviewRef = firestore()
              .collection("forReview")
              .doc("posts")
              .collection("items")
              .doc(itemId);
            
            await forReviewRef.set({
              itemId,
              itemType,
              parentCommentId: itemType === "reply" ? parentCommentId : null,
              reportsCount: newReports,
              createdAt: firestore.FieldValue.serverTimestamp(),
              originalData: snapshot.data(),
              quarter: getYearQuarter(),
              status: "pending", 
              actionTaken: null,
              reporters: reporters
            });
            
            console.log(`Successfully added ${itemId} to forReview with ${reporters.length} reporters`);
          }
        } else {
          console.log(`Item not found: ${itemId} of type ${itemType}`);
        }
      } catch (error) {
        console.error("Error updating report count:", error);
        console.error("Error details:", error.message, error.code);
      }
      return true;
    } catch (error) {
      console.error("Error in submitReport:", error);
      throw error;
    }
  },

  checkIfUserReported: async (itemId, userId) => { 
    try { 
      const snapshot = await userReportsCollection(userId).doc(itemId).get(); 
      if (!snapshot.exists) { 
        return false; 
      } 
      const data = snapshot.data(); 
      return !!data?.hidden; 
    } catch (error) { 
      console.error("Error checking if user reported:", error); 
      return false; 
    } 
  }, 
}; 

const getItemRef = (itemId, itemType, parentCommentId = null) => { 
  const quarterDoc = getYearQuarter(); 
  if (itemType === "comment") { 
    return firestore()
      .collection("community_progress")
      .doc(quarterDoc)
      .collection("community_comments")
      .doc(itemId); 
  } else if (itemType === "reply") { 
    if (!parentCommentId) { 
      throw new Error("parentCommentId is required for replies"); 
    } 
    return firestore()
      .collection("community_progress")
      .doc(quarterDoc)
      .collection("community_comments")
      .doc(parentCommentId)
      .collection("replies")
      .doc(itemId); 
  } else { 
    throw new Error(`Unknown itemType: ${itemType}`); 
  } 
};