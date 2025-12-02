import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { scale } from "../utils/scaling";

const ReportCard = ({ item, onPress }) => {
  // Get status color
  const getStatusColor = () => {
    if (item.status === "reviewed") {
      return "#066914ff"; // Darker green for reviewed
    }
    return "#771010ff"; // Darker red for pending
  };

  // Get status text
  const getStatusText = () => {
    if (item.status === "reviewed") {
      return "Reviewed";
    }
    return "Pending";
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.username}>{item.username || "Unknown User"}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>
      
      <Text style={styles.date}>
        {item.createdAt
          ? new Date(item.createdAt.toDate()).toLocaleString()
          : "N/A"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    padding: scale(14),
    borderRadius: scale(10),
    marginBottom: scale(12),
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(6),
  },
  username: {
    fontSize: scale(14),
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    minWidth: scale(70),
    alignItems: "center",
  },
  statusText: {
    fontSize: scale(10),
    fontWeight: "600",
    color: "#f0f0f0ff",
  },
  date: {
    fontSize: scale(12),
    color: "#bbb",
  },
});

export default ReportCard;