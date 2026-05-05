import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { scale } from "../utils/scaling";

const ReportCard = ({ item, onPress }) => {
  const getStatusColor = () => {
    if (item.status === "reviewed") {
      return "#709775"; 
    }
    return "#D32F2F"; 
  };

  const getStatusText = () => {
    if (item.status === "reviewed") {
      return "Reviewed";
    }
    return "Pending Review";
  };

  const getReporterCount = () => {
    return item.reporters?.length || 0;
  };

  const getPrimaryCategory = () => {
    return item.reporters?.[0]?.category || "Uncategorized";
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.username} numberOfLines={1}>
            {item.username || "Unknown User"}
          </Text>
          <View style={[styles.statusContainer, { backgroundColor: getStatusColor() + "15" }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>CATEGORY</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {getPrimaryCategory()}
            </Text>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>REPORTS</Text>
            <Text style={styles.detailValue}>
              {getReporterCount()}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.timestampText}>
            {item.createdAt
              ? new Date(item.createdAt.toDate()).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : "Date N/A"}
          </Text>
          
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: scale(16),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "#2A2A2A",
    overflow: "hidden",
  },
  cardContent: {
    padding: scale(16),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(14),
  },
  username: {
    fontSize: scale(16),
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    marginRight: scale(12),
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    marginRight: scale(6),
  },
  statusText: {
    fontSize: scale(12),
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#252525",
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: scale(14),
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: scale(10),
    color: "#888888",
    marginBottom: scale(4),
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: scale(14),
    color: "#FFFFFF",
    fontWeight: "600",
  },
  separator: {
    width: 1,
    height: scale(24),
    backgroundColor: "#333333",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestampText: {
    fontSize: scale(12),
    color: "#888888",
    flex: 1,
  },
  arrowContainer: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: scale(8),
  },
  arrow: {
    fontSize: scale(18),
    color: "#709775",
    fontWeight: "bold",
    marginLeft: scale(2),
  },
});

export default ReportCard;