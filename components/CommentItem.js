// components/CommentItem.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { scale } from "../utils/scaling";
import Ionicons from "react-native-vector-icons/Ionicons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import ReportModal from "./ReportModal";
import { reportService } from "../services/reportService";
import { reportRepository } from "../repositories/reportRepository";

// 🔥 Utility to compute year-quarter string
const getYearQuarter = () => {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) + 1; // 1–4
  return `${year}-Q${quarter}`;
};

// ======================
// ReplyItem Component
// ======================
const ReplyItem = ({ reply, commentRef, currentUserId, onDeleteReply, commentId }) => {
  const replyUsername = reply.username || "Anonymous";
  const replyFirstLetter = replyUsername.charAt(0).toUpperCase();
  const replyRef = commentRef.collection("replies").doc(reply.id);

  const [replyLikeCount, setReplyLikeCount] = useState(reply.likesCount || 0);
  const [replyIsLiked, setReplyIsLiked] = useState(false);
  const [showReplyReportModal, setShowReplyReportModal] = useState(false);
  const [isHiddenForUser, setIsHiddenForUser] = useState(false);

  useEffect(() => {
    // Check if this reply is hidden for this user
    let mounted = true;
    const checkHiddenStatus = async () => {
      if (currentUserId) {
        try {
          const reported = await reportRepository.checkIfUserReported(reply.id, currentUserId);
          if (mounted) setIsHiddenForUser(reported);
        } catch (error) {
          console.error("Error checking reply report status:", error);
          if (mounted) setIsHiddenForUser(false);
        }
      }
    };
    
    checkHiddenStatus();
    return () => { mounted = false; };
  }, [reply.id, currentUserId]);

  useEffect(() => {
    const unsubscribe = replyRef.collection("likes").onSnapshot((snapshot) => {
      setReplyLikeCount(snapshot.size);
      setReplyIsLiked(snapshot.docs.some((doc) => doc.id === currentUserId));
    });
    return () => unsubscribe();
  }, [reply.id, currentUserId]);

  if (isHiddenForUser || reply.hidden) return null;

  const handleReplyLike = async () => {
    if (!currentUserId) return;
    const likeRef = replyRef.collection("likes").doc(currentUserId);
    try {
      if (replyIsLiked) {
        await likeRef.delete();
      } else {
        await likeRef.set({
          userId: currentUserId,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Failed to toggle reply like:", error);
    }
  };

  const handleReportReply = async (category, subType) => {
    setShowReplyReportModal(false);
    try {
      await reportService.submitReport(
        reply.id,
        "reply",
        currentUserId,
        category,
        subType,
        commentId
      );
      
      // Immediately hide the reply after reporting
      setIsHiddenForUser(true);
      
      Alert.alert("Report Submitted", "Thank you for reporting this reply. It has been hidden.");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.replyItem}>
      <View style={styles.replyHeader}>
        {reply.avatar ? (
          <Image source={{ uri: reply.avatar }} style={styles.replyAvatar} />
        ) : (
          <View style={styles.replyAvatarPlaceholder}>
            <Text style={styles.replyAvatarText}>{replyFirstLetter}</Text>
          </View>
        )}
        <Text style={styles.replyUsername}>{replyUsername}</Text>

        {reply.userId && currentUserId && reply.userId === currentUserId ? (
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Delete Reply", "Are you sure you want to delete this reply?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => onDeleteReply(commentId, reply.id),
                },
              ]);
            }}
            style={{ marginLeft: "auto" }}
          >
            <Text style={{ color: "#FF6B6B", fontWeight: "600" }}>Delete</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowReplyReportModal(true)}
            style={{ marginLeft: "auto", marginRight: scale(4) }}
          >
            <Ionicons name="ellipsis-vertical-outline" size={scale(16)} color="#CCCCCC" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.replyText}>{reply.text}</Text>
      <View style={styles.replyActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleReplyLike}>
          <Ionicons
            name={replyIsLiked ? "heart" : "heart-outline"}
            size={scale(16)}
            color={replyIsLiked ? "#FF6B6B" : "#CCCCCC"}
            style={{ marginRight: scale(4) }}
          />
          <Text style={[styles.actionText, replyIsLiked && styles.likedText]}>
            {replyLikeCount}
          </Text>
        </TouchableOpacity>
      </View>

      <ReportModal
        visible={showReplyReportModal}
        onClose={() => setShowReplyReportModal(false)}
        onSelectCategory={handleReportReply}
      />
    </View>
  );
};

// ======================
// CommentItem Component
// ======================
const CommentItem = ({ comment, onReply, onDeleteComment, onDeleteReply }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isHiddenForUser, setIsHiddenForUser] = useState(false);

  const currentUserId = auth().currentUser?.uid;
  const username = comment.username || "Anonymous";
  const firstLetter = username.charAt(0).toUpperCase();

  const yearQuarter = getYearQuarter();
  const commentRef = firestore()
    .collection("community_progress")
    .doc(yearQuarter)
    .collection("community_comments")
    .doc(comment.id);

  // In CommentItem component - FIXED useEffect
  useEffect(() => {
    let mounted = true;
    const checkHiddenStatus = async () => {
      if (currentUserId) {
        try {
          const reported = await reportRepository.checkIfUserReported(comment.id, currentUserId);
          console.log(`Comment ${comment.id} hidden status:`, reported); // Debug log
          if (mounted) setIsHiddenForUser(reported);
        } catch (error) {
          console.error("Error checking comment report status:", error);
          if (mounted) setIsHiddenForUser(false); // Show content if there's an error
        }
      }
    };
    
    checkHiddenStatus();
    return () => { mounted = false; };
  }, [comment.id, currentUserId]);

  useEffect(() => {
    const unsubscribe = commentRef.collection("likes").onSnapshot((snapshot) => {
      setLikeCount(snapshot.size);
      setIsLiked(snapshot.docs.some((doc) => doc.id === currentUserId));
    });
    return () => unsubscribe();
  }, [comment.id, currentUserId]);

  if (isHiddenForUser || comment.hidden) return null;

  const handleLike = async () => {
    if (!currentUserId) return;
    const likeRef = commentRef.collection("likes").doc(currentUserId);
    try {
      if (isLiked) {
        await likeRef.delete();
      } else {
        await likeRef.set({
          userId: currentUserId,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const handlePostReply = async () => {
    if (!replyText.trim()) return;
    setPostingReply(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText("");
      setShowReplyInput(false);
      if (!showReplies) setShowReplies(true);
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setPostingReply(false);
    }
  };

  const handleReportComment = async (category, subType) => {
    setShowReportModal(false);
    try {
      await reportService.submitReport(
        comment.id,
        "comment",
        currentUserId,
        category,
        subType
      );
      
      // Immediately hide the comment after reporting
      setIsHiddenForUser(true);
      
      Alert.alert("Report Submitted", "Your report has been submitted successfully.");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        {comment.avatar ? (
          <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
        ) : (
          <View style={styles.commentAvatarPlaceholder}>
            <Text style={styles.commentAvatarText}>{firstLetter}</Text>
          </View>
        )}
        <Text style={styles.commentUsername}>{username}</Text>

        {comment.userId && currentUserId && comment.userId === currentUserId ? (
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Delete Comment", "Are you sure you want to delete this comment?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => onDeleteComment(comment.id),
                },
              ]);
            }}
            style={{ marginLeft: "auto" }}
          >
            <Ionicons name="trash-outline" size={scale(18)} color="#FF6B6B" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowReportModal(true)}
            style={{ marginLeft: "auto", marginRight: scale(4) }}
          >
            <Ionicons name="ellipsis-vertical-outline" size={scale(18)} color="#CCCCCC" />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.commentText}>{comment.text}</Text>

      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={scale(16)}
            color={isLiked ? "#FF6B6B" : "#CCCCCC"}
            style={{ marginRight: scale(4) }}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowReplyInput(!showReplyInput)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={scale(16)}
            color="#CCCCCC"
            style={{ marginRight: scale(4) }}
          />
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>

        {comment.replies?.length > 0 && (
          <TouchableOpacity
            style={styles.repliesToggle}
            onPress={() => setShowReplies(!showReplies)}
          >
            <Text style={styles.repliesText}>
              {showReplies
                ? `Hide ${comment.replies.length} replies`
                : `View ${comment.replies.length} replies`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showReplyInput && (
        <View style={styles.replyInputContainer}>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write a reply..."
            placeholderTextColor="#888"
            style={styles.replyInput}
            multiline
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowReplyInput(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePostReply}
              disabled={postingReply || !replyText.trim()}
              style={[styles.postReplyButton, { opacity: replyText.trim() ? 1 : 0.6 }]}
            >
              {postingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.postReplyButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showReplies && comment.replies?.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              commentRef={commentRef}
              currentUserId={currentUserId}
              onDeleteReply={onDeleteReply}
              commentId={comment.id}
            />
          ))}
        </View>
      )}

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSelectCategory={handleReportComment}
      />
    </View>
  );
};

// ======================
// Styles
// ======================
const styles = {
  commentContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: scale(8),
    padding: scale(12),
    marginVertical: scale(6),
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(8),
  },
  commentAvatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    marginRight: scale(8),
  },
  commentAvatarPlaceholder: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#415D43",
    marginRight: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: scale(14),
  },
  commentUsername: {
    color: "#CCCCCC",
    fontWeight: "bold",
    fontSize: scale(14),
  },
  commentText: {
    color: "#CCCCCC",
    fontSize: scale(13),
    marginBottom: scale(8),
    lineHeight: scale(18),
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(16),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  actionText: {
    color: "#CCCCCC",
    fontSize: scale(12),
  },
  likedText: {
    color: "#FF6B6B",
  },
  repliesToggle: {
    marginLeft: "auto",
  },
  repliesText: {
    color: "#709775",
    fontSize: scale(12),
    fontWeight: "500",
  },
  replyInputContainer: {
    marginTop: scale(12),
    backgroundColor: "#111D13",
    borderRadius: scale(8),
    padding: scale(12),
    minWidth: "100%",
  },
  replyInput: {
    backgroundColor: "#1E1E1E",
    color: "#fff",
    padding: scale(8),
    borderRadius: scale(6),
    fontSize: scale(13),
    minHeight: scale(40),
    maxHeight: scale(100),
    marginBottom: scale(8),
  },
  replyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(8),
    alignItems: "center",
  },
  cancelButton: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(14),
    borderRadius: scale(6),
  },
  cancelButtonText: {
    color: "#CCCCCC",
    fontSize: scale(12),
    fontWeight: "500",
  },
  postReplyButton: {
    backgroundColor: "#415D43",
    paddingVertical: scale(6),
    paddingHorizontal: scale(14),
    borderRadius: scale(6),
    justifyContent: "center",
    alignItems: "center",
  },
  postReplyButtonText: {
    color: "#fff",
    fontSize: scale(12),
    fontWeight: "bold",
  },
  repliesContainer: {
    marginTop: scale(12),
    paddingLeft: scale(12),
    borderLeftWidth: 2,
    borderLeftColor: "#415D43",
  },
  replyItem: {
    backgroundColor: "#111D13",
    borderRadius: scale(6),
    padding: scale(8),
    marginBottom: scale(6),
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(4),
  },
  replyAvatar: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    marginRight: scale(6),
  },
  replyAvatarPlaceholder: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#415D43",
    marginRight: scale(6),
    alignItems: "center",
    justifyContent: "center",
  },
  replyAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: scale(10),
  },
  replyUsername: {
    color: "#CCCCCC",
    fontWeight: "bold",
    fontSize: scale(12),
  },
  replyText: {
    color: "#CCCCCC",
    fontSize: scale(12),
    marginBottom: scale(4),
  },
  replyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: scale(8),
    gap: scale(8),
  },
};

export default CommentItem;