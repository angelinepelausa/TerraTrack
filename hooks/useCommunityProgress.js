// hooks/useCommunityProgress.js
import { useState, useEffect, useRef } from "react";
import auth from "@react-native-firebase/auth";
import {
  getCommunityProgress,
  getCommunityLeaderboard,
  getUserContribution,
  getRecentActivity,
  getComments,
  postComment,
  likeComment,
  likeReply,
  replyToComment,
  deleteComment,
  deleteReply,
  getCurrentYearQuarter,
} from "../repositories/communityProgressRepository";

export const useCommunityProgress = () => {
  const confettiRef = useRef(null);
  const [progressData, setProgressData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userContribution, setUserContribution] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentQuarter, setCurrentQuarter] = useState(null);
  
  const currentUserId = auth().currentUser?.uid;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const quarter = getCurrentYearQuarter();
      setCurrentQuarter(quarter);
      
      const [progress, topUsers, contribution, activity, initialComments] = await Promise.all([
        getCommunityProgress(quarter),
        getCommunityLeaderboard(quarter),
        getUserContribution(),
        getRecentActivity(),
        getComments(),
      ]);
      
      setProgressData(progress);
      setLeaderboard(topUsers || []);
      setUserContribution(contribution || 0);
      setRecentActivity(activity || []);
      setComments(initialComments || []);

      if (progress?.goal && progress.current / progress.goal >= 1) {
        confettiRef.current?.start();
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeMessage = () => {
    if (!progressData) return "";
    const { endDate, current, goal } = progressData;
    const daysLeft = endDate
      ? Math.max(Math.floor((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)), 0)
      : 0;
    const progressPercent = goal > 0 ? current / goal : 0;

    if (progressPercent > 0.75) return `Almost there! Just ${daysLeft} day(s) to go!`;
    if (progressPercent >= 0.5) return `We're on track! ${daysLeft} day(s) remaining.`;
    return `We need your help! Let's finish strong in ${daysLeft} day(s)!`;
  };

  const handlePostComment = async (commentText) => {
    if (!commentText.trim()) return;
    try {
      const newComment = await postComment(commentText.trim());
      setComments((prev) => [newComment, ...prev]);
      return true;
    } catch (error) {
      console.error("Failed to post comment:", error);
      throw error;
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const result = await likeComment(commentId, currentQuarter);
      setComments(prev =>
        prev.map(comment => {
          if (comment.id === commentId) {
            return { 
              ...comment, 
              likesCount: result.likesCount,
              likes: result.liked 
                ? [...(comment.likes || []), currentUserId].filter(Boolean)
                : (comment.likes || []).filter(id => id !== currentUserId)
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Failed to like comment:", error);
      throw error;
    }
  };

  const handleLikeReply = async (commentId, replyId) => {
    try {
      const result = await likeReply(commentId, replyId, currentQuarter);
      setComments(prev =>
        prev.map(comment => {
          if (comment.id === commentId) {
            const updatedReplies = (comment.replies || []).map(reply => {
              if (reply.id === replyId) {
                return {
                  ...reply,
                  likesCount: result.likesCount,
                  likes: result.liked
                    ? [...(reply.likes || []), currentUserId].filter(Boolean)
                    : (reply.likes || []).filter(id => id !== currentUserId)
                };
              }
              return reply;
            });
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Failed to like reply:", error);
      throw error;
    }
  };

  const handleReplyToComment = async (commentId, replyText) => {
    try {
      const newReply = await replyToComment(commentId, replyText);
      setComments(prev =>
        prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Failed to post reply:", error);
      throw error;
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error("Failed to delete comment:", error);
      throw error;
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    try {
      await deleteReply(commentId, replyId);
      setComments(prev =>
        prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, replies: (comment.replies || []).filter(r => r.id !== replyId) };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Failed to delete reply:", error);
      throw error;
    }
  };

  return {
    confettiRef,
    progressData,
    leaderboard,
    loading,
    userContribution,
    recentActivity,
    comments,
    currentUserId,
    getTimeMessage,
    handlePostComment,
    handleLikeComment,
    handleLikeReply,
    handleReplyToComment,
    handleDeleteComment,
    handleDeleteReply,
    refreshData: loadData,
  };
};