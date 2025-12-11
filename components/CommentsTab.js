// components/CommentsTab.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  RefreshControl,
} from "react-native";
import { scale } from "../utils/scaling";
import CommentItem from "./CommentItem";

// ✅ Extracted input into its own component
const CommentInput = ({
  commentText,
  setCommentText,
  postingComment,
  handlePostComment,
}) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    style={{ marginBottom: scale(16) }}
  >
    <View style={styles.inputContainer}>
      <TextInput
        value={commentText}
        onChangeText={setCommentText}
        placeholder="Give some motivation..."
        placeholderTextColor="#888"
        style={styles.commentInput}
        multiline
        textAlignVertical="top"
      />
      <TouchableOpacity
        onPress={handlePostComment}
        disabled={postingComment || !commentText.trim()}
        style={[styles.postButton, { opacity: commentText.trim() ? 1 : 0.6 }]}
      >
        {postingComment ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.postButtonText}>Post</Text>
        )}
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
);

const CommentsTab = ({
  comments,
  onPostComment,
  onLikeComment,
  onLikeReply,
  onReplyToComment,
  onDeleteComment,
  onDeleteReply,
  currentUserId,
  refreshData, // ✅ Add refreshData prop
}) => {
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // ✅ Add refreshing state

  // ✅ Handle pull-to-refresh
  const handleRefresh = async () => {
    if (!refreshData) return;
    
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error("Failed to refresh comments:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      await onPostComment(commentText.trim());
      setCommentText("");
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000", padding: scale(16) }}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        // ✅ Add RefreshControl for pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#709775"]} // Android
            tintColor="#709775" // iOS
            title="Refreshing comments..."
            titleColor="#CCCCCC"
          />
        }
        ListHeaderComponent={
          <CommentInput
            commentText={commentText}
            setCommentText={setCommentText}
            postingComment={postingComment}
            handlePostComment={handlePostComment}
          />
        }
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            onLike={onLikeComment}
            onReply={onReplyToComment}
            onLikeReply={onLikeReply}
            onDeleteComment={onDeleteComment}
            onDeleteReply={onDeleteReply}
            currentUserId={currentUserId}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {refreshing ? (
              <ActivityIndicator size="large" color="#709775" />
            ) : (
              <Text style={styles.emptyText}>
                No comments yet. Be the first to start the conversation!
              </Text>
            )}
          </View>
        )}
        // ✅ Show loading indicator at the bottom when refreshing
        ListFooterComponent={
          refreshing ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#709775" />
              <Text style={styles.refreshingText}>Refreshing...</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = {
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(40),
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    fontStyle: "italic",
    fontSize: scale(14),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: scale(12),
    paddingRight: scale(8),
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#111D13",
    color: "#fff",
    paddingHorizontal: scale(12),
    paddingTop: scale(10),
    paddingBottom: scale(10),
    borderRadius: scale(8),
    fontSize: scale(14),
    minHeight: scale(44),
    maxHeight: scale(120),
    textAlignVertical: "top",
  },
  postButton: {
    backgroundColor: "#415D43",
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: scale(14),
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(8),
  },
  refreshingText: {
    color: "#709775",
    fontSize: scale(12),
    fontWeight: "500",
  },
};

export default CommentsTab;