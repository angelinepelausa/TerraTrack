import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { scale, vScale } from "../utils/scaling";

const RecentActivityItem = ({ activity, currentUserId }) => {
  const navigation = useNavigation();

  // Navigate based on user - FIXED: use activity.userId instead of activity.id
  const handleUserPress = (activity) => {
    if (activity.userId === currentUserId) {
      navigation.navigate("ProfileScreen", { userId: activity.userId }); // Own profile
    } else {
      navigation.navigate("PublicProfileScreen", { userId: activity.userId }); // Other's profile
    }
  };

  // Calculate relative time
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // in seconds

    if (diff < 60) return `${diff} sec${diff !== 1 ? "s" : ""} ago`;
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }
    const days = Math.floor(diff / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
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
