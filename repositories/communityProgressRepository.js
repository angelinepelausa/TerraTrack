import firestore from '@react-native-firebase/firestore';
import { addUserRewards, populateUserData } from './userRepository';
import auth from '@react-native-firebase/auth';

export const getCurrentYearQuarter = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); 
  let quarter = 'Q1';

  if (month >= 0 && month <= 2) quarter = 'Q1';
  else if (month >= 3 && month <= 5) quarter = 'Q2';
  else if (month >= 6 && month <= 8) quarter = 'Q3';
  else if (month >= 9 && month <= 11) quarter = 'Q4';

  return `${year}-${quarter}`;
};

export const getCommunityProgress = async (yearQuarter = null) => {
  try {
    const docId = yearQuarter || getCurrentYearQuarter();
    const docSnap = await firestore()
      .collection('community_progress')
      .doc(docId)
      .get();

    if (!docSnap.exists) return null;
    return docSnap.data();
  } catch (error) {
    console.error('Error fetching community progress:', error);
    throw error;
  }
};

export const addCommunityProgress = async (payload) => {
  try {
    const { yearQuarter, title, description, goal, rewards, image } = payload;
    if (!yearQuarter) throw new Error('Year-Quarter is required');

    const docRef = firestore().collection('community_progress').doc(yearQuarter);

    const [year, quarter] = yearQuarter.split('-');
    let startMonth = 0;
    let endMonth = 2;

    if (quarter === 'Q1') { startMonth = 0; endMonth = 2; }
    else if (quarter === 'Q2') { startMonth = 3; endMonth = 5; }
    else if (quarter === 'Q3') { startMonth = 6; endMonth = 8; }
    else if (quarter === 'Q4') { startMonth = 9; endMonth = 11; }

    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, endMonth + 1, 0, 23, 59, 59);

    await docRef.set({
      title,
      description,
      goal: parseInt(goal, 10),
      current: 0,
      participants: [],
      contributors: {},
      rewards,
      image: image || null,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      finalLeaderboard: [],
      processed: false,
    });

    return true;
  } catch (error) {
    console.error('Error adding community progress:', error);
    throw error;
  }
};

export const getCommunityLeaderboard = async (yearQuarter = null) => {
  try {
    const data = await getCommunityProgress(yearQuarter);
    if (!data) return [];

    if (data.processed && data.finalLeaderboard && data.finalLeaderboard.length > 0) {
      return data.finalLeaderboard;
    }

    const contributorsMap = data.contributors || {};
    const rewards = data.rewards || {};

    const contributorsArray = await Promise.all(
      Object.entries(contributorsMap).map(async ([userId, points]) => {
        const { username, avatar } = await populateUserData(userId);
        
        return {
          id: userId,
          userId: userId, 
          username: username || userId,
          avatar: avatar || null,
          terraPoints: points || 0,
        };
      })
    );

    // Sort by points pababa
    contributorsArray.sort((a, b) => b.terraPoints - a.terraPoints);

    // Assign ranks and rewards
    contributorsArray.forEach((item, index) => {
      item.rank = index + 1;
      
      if (item.rank === 1) item.reward = rewards.top1;
      else if (item.rank === 2) item.reward = rewards.top2;
      else if (item.rank === 3) item.reward = rewards.top3;
      else if (item.rank >= 4 && item.rank <= 10) item.reward = rewards.top4to10;
      else item.reward = rewards.top11plus || { terraCoins: 0, terraPoints: 0 };
    });

    return contributorsArray;
  } catch (error) {
    console.error('Error fetching community leaderboard:', error);
    throw error;
  }
};

export const getUserCommunityRank = async (userId, yearQuarter = null) => {
  const leaderboard = await getCommunityLeaderboard(yearQuarter);
  return leaderboard.find((u) => u.id === userId) || null;
};

export const processQuarterEnd = async () => {
  try {
    const currentQuarter = getCurrentYearQuarter();
    const docRef = firestore().collection('community_progress').doc(currentQuarter);

    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new Error('No current quarter data found');

    const currentData = docSnap.data();
    if (currentData.processed) return;

    const leaderboard = await getCommunityLeaderboard(currentQuarter);

    await Promise.all(
      leaderboard.map((user) => addUserRewards(user.id, user.reward.terraCoins, user.reward.terraPoints))
    );

    await docRef.update({ finalLeaderboard: leaderboard, processed: true });

    console.log(`Quarter ${currentQuarter} processed. Final leaderboard saved.`);
  } catch (error) {
    console.error('Error processing quarter end:', error);
    throw error;
  }
};

export const getNextQuarter = (yearQuarter) => {
  const [yearStr, quarter] = yearQuarter.split('-');
  let year = parseInt(yearStr, 10);
  let nextQuarter = '';

  switch (quarter) {
    case 'Q1': nextQuarter = 'Q2'; break;
    case 'Q2': nextQuarter = 'Q3'; break;
    case 'Q3': nextQuarter = 'Q4'; break;
    case 'Q4':
      nextQuarter = 'Q1';
      year += 1;
      break;
  }

  return `${year}-${nextQuarter}`;
};

export const getUpcomingQuarters = async () => {
  try {
    const now = new Date();
    const snapshot = await firestore()
      .collection('community_progress')
      .where('startDate', '>', now.toISOString())
      .orderBy('startDate', 'asc')
      .get();

    if (snapshot.empty) return [];

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching upcoming quarters:', error);
    throw error;
  }
};

export const deleteCommunityProgress = async (yearQuarter) => {
  try {
    await firestore().collection('community_progress').doc(yearQuarter).delete();
    return true;
  } catch (error) {
    console.error('Error deleting community progress:', error);
    throw error;
  }
};

export const updateCommunityProgress = async (originalYearQuarter, payload) => {
  try {
    const { yearQuarter, ...updateData } = payload;

    const existingDoc = await firestore()
      .collection('community_progress')
      .doc(originalYearQuarter)
      .get();
    
    if (!existingDoc.exists) {
      throw new Error('Document not found');
    }
    
    const existingData = existingDoc.data();
    
    const mergedData = {
      ...existingData,
      ...updateData,
      startDate: updateData.startDate || existingData.startDate,
      endDate: updateData.endDate || existingData.endDate,
      current: updateData.current !== undefined ? updateData.current : existingData.current,
      participants: updateData.participants || existingData.participants,
      contributors: updateData.contributors || existingData.contributors,
      processed: updateData.processed !== undefined ? updateData.processed : existingData.processed,
      finalLeaderboard: updateData.finalLeaderboard || existingData.finalLeaderboard,
    };
    
    if (originalYearQuarter !== yearQuarter) {
      await firestore()
        .collection('community_progress')
        .doc(yearQuarter)
        .set(mergedData);
      
      await firestore()
        .collection('community_progress')
        .doc(originalYearQuarter)
        .delete();
    } else {
      await firestore()
        .collection('community_progress')
        .doc(yearQuarter)
        .update(mergedData);
    }

    return true;
  } catch (error) {
    console.error('Error updating community progress:', error);
    throw error;
  }
};

export const getUserContribution = async () => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User must be authenticated');

    const currentQuarter = getCurrentYearQuarter();
    const progressData = await getCommunityProgress(currentQuarter);
    if (!progressData || !progressData.contributors) return 0;

    return progressData.contributors[currentUser.uid] || 0;
  } catch (error) {
    console.error('Error fetching user contribution:', error);
    throw error;
  }
};

export const getRecentActivity = async (limit = 3) => {
  try {
    const currentQuarter = getCurrentYearQuarter();
    const communityRef = firestore().collection('community_progress').doc(currentQuarter);
    const communityActivityRef = communityRef.collection('community_activity');

    const snapshot = await communityActivityRef
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    if (snapshot.empty) return [];

    return Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      const { username, avatar } = await populateUserData(data.userId);
      return {
        id: doc.id,
        ...data,
        username: username || data.username || "Unknown",
        avatar: avatar || null,
        title: data.title || data.action || "finished a task",
      };
    }));
  } catch (error) {
    console.log('No activity data available yet', error);
    return [];
  }
};

const getReplyLikesCount = async (commentId, replyId, progressId = null) => {
  const currentQuarter = progressId || getCurrentYearQuarter();
  const likesSnapshot = await firestore()
    .collection('community_progress')
    .doc(currentQuarter)
    .collection('community_comments')
    .doc(commentId)
    .collection('replies')
    .doc(replyId)
    .collection('likes')
    .get();

  return likesSnapshot.size;
};

export const getRepliesForComment = async (progressId, commentId, parentReplyId = null) => {
  try {
    const snapshot = await firestore()
      .collection("community_progress")
      .doc(progressId)
      .collection("community_comments")
      .doc(commentId)
      .collection("replies")
      .orderBy("timestamp", "asc")
      .get();

    if (snapshot.empty) return [];

    const replies = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();

      const likesSnap = await doc.ref.collection('likes').get();
      const likes = likesSnap.docs.map(likeDoc => likeDoc.id);
      const likesCount = likes.length;

      const { username, avatar } = await populateUserData(data.userId);
      return {
        id: doc.id,
        ...data,
        username: username || data.username || "Unknown",
        avatar: avatar || null,
        likes,
        likesCount
      };
    }));

    return replies.filter(reply => {
      if (parentReplyId) return reply.parentReplyId === parentReplyId;
      return !reply.parentReplyId;
    });
  } catch (error) {
    console.error("Error fetching replies:", error);
    return [];
  }
};

export const getComments = async (limit = 20) => {
  try {
    const currentQuarter = getCurrentYearQuarter();
    const snapshot = await firestore()
      .collection('community_progress')
      .doc(currentQuarter)
      .collection('community_comments')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    if (snapshot.empty) return [];

    const comments = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      const replies = await getRepliesForComment(currentQuarter, doc.id);
      const likesSnapshot = await doc.ref.collection('likes').get();
      const likes = likesSnapshot.docs.map(likeDoc => likeDoc.id);
      
      const { username, avatar } = await populateUserData(data.userId);
      
      return {
        id: doc.id,
        ...data,
        username: username || data.username || "Unknown",
        avatar: avatar || null,
        likes,
        likesCount: likes.length,
        replies
      };
    }));

    return comments;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return [];
  }
};

export const postComment = async (commentText) => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User must be authenticated');

    const currentQuarter = getCurrentYearQuarter();
    const commentRef = firestore()
      .collection('community_progress')
      .doc(currentQuarter)
      .collection('community_comments')
      .doc();

    const comment = {
      id: commentRef.id,
      userId: currentUser.uid,
      text: commentText,
      timestamp: firestore.FieldValue.serverTimestamp(),
    };

    await commentRef.set(comment);
    
    const { username, avatar } = await populateUserData(currentUser.uid);
    return {
      ...comment,
      username: username || currentUser.displayName || "Anonymous",
      avatar: avatar || null,
      likes: [],
      likesCount: 0,
      replies: []
    };
  } catch (error) {
    console.error('Failed to post comment:', error);
    throw error;
  }
};

const getLikesCount = async (commentId, progressId = null) => {
  const currentQuarter = progressId || getCurrentYearQuarter();
  const likesSnapshot = await firestore()
    .collection('community_progress')
    .doc(currentQuarter)
    .collection('community_comments')
    .doc(commentId)
    .collection('likes')
    .get();
  
  return likesSnapshot.size;
};

export const likeComment = async (commentId, progressId = null) => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User must be logged in');

    const currentQuarter = progressId || getCurrentYearQuarter();
    const likeRef = firestore()
      .collection('community_progress')
      .doc(currentQuarter)
      .collection('community_comments')
      .doc(commentId)
      .collection('likes')
      .doc(currentUser.uid);

    const likeSnap = await likeRef.get();
    
    if (likeSnap.exists) {
      await likeRef.delete();
      return { liked: false, likesCount: await getLikesCount(commentId, currentQuarter) };
    } else {
      await likeRef.set({ timestamp: firestore.FieldValue.serverTimestamp() });
      return { liked: true, likesCount: await getLikesCount(commentId, currentQuarter) };
    }
  } catch (error) {
    console.error('Failed to like comment:', error);
    throw error;
  }
};

export const likeReply = async (commentId, replyId, progressId = null) => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User must be logged in');

    const currentQuarter = progressId || getCurrentYearQuarter();
    const likeRef = firestore()
      .collection('community_progress')
      .doc(currentQuarter)
      .collection('community_comments')
      .doc(commentId)
      .collection('replies')
      .doc(replyId)
      .collection('likes')
      .doc(currentUser.uid);

    const likeSnap = await likeRef.get();
    
    if (likeSnap.exists) {
      await likeRef.delete();
      const likesCount = await getReplyLikesCount(commentId, replyId, currentQuarter);
      return { liked: false, likesCount };
    } else {
      await likeRef.set({ timestamp: firestore.FieldValue.serverTimestamp() });
      const likesCount = await getReplyLikesCount(commentId, replyId, currentQuarter);
      return { liked: true, likesCount };
    }
  } catch (error) {
    console.error('Failed to like reply:', error);
    throw error;
  }
};

export const replyToComment = async (commentId, replyText, parentReplyId = null) => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User must be logged in');

    const currentQuarter = getCurrentYearQuarter();
    const repliesRef = firestore()
      .collection('community_progress')
      .doc(currentQuarter)
      .collection('community_comments')
      .doc(commentId)
      .collection('replies');

    const replyDoc = repliesRef.doc();

    const replyData = {
      id: replyDoc.id,
      userId: currentUser.uid,
      text: replyText,
      parentReplyId,
      timestamp: firestore.FieldValue.serverTimestamp(),
    };

    await replyDoc.set(replyData);
    
    const { username, avatar } = await populateUserData(currentUser.uid);
    return {
      ...replyData,
      username: username || currentUser.displayName || "Anonymous",
      avatar: avatar || null,
      likes: [],
      likesCount: 0
    };
  } catch (error) {
    console.error('Failed to post reply:', error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User must be logged in');

    const currentQuarter = getCurrentYearQuarter();
    const commentRef = firestore()
      .collection('community_progress')
      .doc(currentQuarter)
      .collection('community_comments')
      .doc(commentId);

    const commentSnap = await commentRef.get();
    if (!commentSnap.exists) throw new Error('Comment not found');

    if (commentSnap.data().userId !== currentUser.uid) {
      throw new Error('You can only delete your own comments');
    }

    const batch = firestore().batch();
    
    const repliesSnapshot = await commentRef.collection('replies').get();
    repliesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    const likesSnapshot = await commentRef.collection('likes').get();
    likesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    batch.delete(commentRef);
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
};

export const deleteReply = async (commentId, replyId) => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User must be logged in');

    const currentQuarter = getCurrentYearQuarter();
    const replyRef = firestore()
      .collection('community_progress')
      .doc(currentQuarter)
      .collection('community_comments')
      .doc(commentId)
      .collection('replies')
      .doc(replyId);

    const replySnap = await replyRef.get();
    if (!replySnap.exists) throw new Error('Reply not found');

    if (replySnap.data().userId !== currentUser.uid) {
      throw new Error('You can only delete your own replies');
    }

    await replyRef.delete();
    return true;
  } catch (error) {
    console.error('Failed to delete reply:', error);
    throw error;
  }
};

export const recordActivity = async (activityData) => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('User must be authenticated');

    const currentQuarter = getCurrentYearQuarter();
    const communityRef = firestore().collection('community_progress').doc(currentQuarter);
    const communityActivityRef = communityRef.collection('community_activity');

    await communityRef.set({ initialized: true }, { merge: true });

    const activityDocRef = communityActivityRef.doc();

    const activity = {
      id: activityDocRef.id,
      userId: currentUser.uid,
      username: currentUser.displayName || 'Anonymous User',
      action: activityData.action,
      timestamp: firestore.FieldValue.serverTimestamp(),
      ...activityData.metadata
    };

    await activityDocRef.set(activity);
    return activity;
  } catch (error) {
    console.log('Failed to record activity', error);
    return null;
  }
};

export default {
  getCurrentYearQuarter,
  getCommunityProgress,
  addCommunityProgress,
  getCommunityLeaderboard,
  getUserCommunityRank,
  processQuarterEnd,
  getNextQuarter,
  getUpcomingQuarters,
  deleteCommunityProgress,
  updateCommunityProgress,
  getUserContribution,
  getRecentActivity,
  recordActivity,
  getComments,
  postComment,
  likeComment,
  likeReply,
  replyToComment,
  deleteComment,
  deleteReply,
};