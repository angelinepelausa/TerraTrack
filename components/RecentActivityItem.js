import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { scale, vScale } from "../utils/scaling";

const RecentActivityItem = ({ activity, currentUserId }) => {
  const navigation = useNavigation();

  // Navigate based on user
  const handleUserPress = (activity) => {
    if (activity.userId === currentUserId) {
      navigation.navigate("ProfileScreen", { userId: activity.userId });
    } else {
      navigation.navigate("PublicProfileScreen", { userId: activity.userId });
    }
  };

  // Calculate relative time - FIXED: Handle Firestore timestamp properly
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "Recently";
    
    let date;
    
    // Handle Firestore timestamp objects
    if (timestamp && typeof timestamp.toDate === 'function') {
      // It's a Firestore timestamp - convert to Date
      date = timestamp.toDate();
    } else if (timestamp && timestamp.seconds) {
      // It's a Firestore timestamp with seconds property
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      // ISO string
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      // Unix timestamp in milliseconds
      date = new Date(timestamp);
    } else {
      // Unknown format, return default
      return "Recently";
    }
    
    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return "Recently";
    }
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // in seconds

    // If difference is negative or extremely large, return "Recently"
    if (diff < 0 || diff > 315360000) { // More than 10 years
      return "Recently";
    }

    if (diff < 60) return `${diff} sec${diff !== 1 ? "s" : ""} ago`;
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }
    if (diff < 604800) {
      const days = Math.floor(diff / 86400);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
    
    // For older dates, show actual date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const timeAgo = getTimeAgo(activity.timestamp);

  return (
    <TouchableOpacity onPress={() => handleUserPress(activity)}>
      <View style={styles.container}>
        {activity.avatar ? (
          <Image source={{ uri: activity.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.activityText}>
            <Text style={styles.username}>{activity.username}</Text> finished a task!
          </Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(8),
    backgroundColor: "#1E1E1E",
    borderRadius: scale(8),
    marginVertical: vScale(4),
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(12),
  },
  avatarPlaceholder: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#555",
    marginRight: scale(12),
  },
  textContainer: { flex: 1 },
  username: { color: "#fff", fontWeight: "bold" },
  activityText: { color: "#ccc" },
  timeAgo: { color: "#888", fontSize: scale(12), marginTop: vScale(2) },
});

export default RecentActivityItem;