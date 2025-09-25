import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { scale } from "../utils/scaling";

const ReportCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>User: {item.userId || "Unknown"}</Text>
      <Text style={styles.subtitle}>
        Date:{" "}
        {item.createdAt
          ? new Date(item.createdAt.toDate()).toLocaleString()
          : "N/A"}
      </Text>
      <Text style={styles.reason} numberOfLines={1}>
        Reason: {item.reason || "N/A"}
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
  title: { fontSize: scale(14), fontWeight: "600", color: "#fff", marginBottom: 4 },
  subtitle: { fontSize: scale(12), color: "#bbb", marginBottom: 6 },
  reason: { fontSize: scale(12), color: "#999" },
});

export default ReportCard;
