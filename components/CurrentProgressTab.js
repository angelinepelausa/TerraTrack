// components/CurrentProgressTab.js
import React, { useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import { scale, vScale } from "../utils/scaling";
import ProgressBar from "./ProgressBar";
import RecentActivityItem from "./RecentActivityItem";

const CurrentProgressTab = ({ progressData, userContribution, recentActivity, getTimeMessage }) => {
  if (!progressData) {
    return (
      <View style={styles.centeredSection}>
        <Text style={styles.emptyText}>No progress data available</Text>
      </View>
    );
  }

  const { title, description, current, goal, image } = progressData;
  const progressPercentage = goal > 0 ? (current / goal) * 100 : 0;
  return (
    <View style={styles.section}>
      <View style={styles.rowHeader}>
        {image && <Image source={{ uri: image }} style={styles.circularImage} />}
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.timeLeft}>{getTimeMessage()}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.progressTitle}>
          Finish {current} / {goal} tasks
        </Text>
        <View style={{ marginTop: vScale(8), width: "90%", alignSelf: "center" }}>
          <ProgressBar
            progress={progressPercentage}
            style={{
              height: vScale(10),
              borderRadius: vScale(5),
              backgroundColor: "#CCCCCC",
              filledColor: "#415D43",
            }}
          />
        </View>
        <View style={{ marginTop: vScale(12) }}>
          <Text style={{ fontWeight: "bold", color: "#415D43", alignSelf: "center" }}>
            Your Contribution: {userContribution} task(s)
          </Text>
        </View>
      </View>

      <View style={{ marginTop: scale(16) }}>
        <Text style={[styles.sectionTitle, { fontSize: scale(16) }]}>Recent Contributors</Text>
        {recentActivity.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity</Text>
        ) : (
          recentActivity.map((item) => <RecentActivityItem key={item.id} activity={item} />)
        )}
      </View>
    </View>
  );
};

const styles = {
  section: { 
    padding: scale(16) 
  },
  centeredSection: { 
    padding: scale(16), 
    alignItems: "center", 
    justifyContent: "center" 
  },
  rowHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: scale(8) 
  },
  circularImage: { 
    width: scale(60), 
    height: scale(60), 
    borderRadius: scale(30), 
    marginRight: scale(12) 
  },
  rowTitle: { 
    fontSize: scale(18), 
    color: "#CCCCCC", 
    fontWeight: "bold", 
    flexShrink: 1 
  },
  description: { 
    color: "#CCCCCC", 
    fontSize: scale(14), 
    marginBottom: scale(8), 
    lineHeight: scale(20), 
    textAlign: "center" 
  },
  timeLeft: { 
    color: "#CCCCCC", 
    fontSize: scale(12), 
    marginBottom: scale(12), 
    fontStyle: "italic", 
    textAlign: "center" 
  },
  infoCard: { 
    backgroundColor: "#CCCCCC", 
    borderRadius: scale(12), 
    padding: scale(20), 
    marginBottom: scale(16) 
  },
  progressTitle: { 
    fontWeight: "600", 
    fontSize: scale(14), 
    marginTop: scale(8), 
    marginBottom: scale(12), 
    color: "#000", 
    textAlign: "center" 
  },
  sectionTitle: {
    fontSize: scale(18),
    color: "#709775",
    fontWeight: "bold",
    marginBottom: scale(8),
    textAlign: "center",
  },
  emptyText: { 
    color: "#888", 
    textAlign: "center", 
    marginTop: scale(20), 
    fontStyle: "italic", 
    fontSize: scale(14) 
  },
};

export default CurrentProgressTab;