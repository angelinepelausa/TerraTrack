// components/LeaderboardTab.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { scale } from "../utils/scaling";
import Leaderboard from "./Leaderboard";

const LeaderboardTab = ({ leaderboard, progressData, onShowRewards, currentUserId }) => {
  return (
    <View style={styles.section}>
      <View style={styles.leaderboardHeader}>
        <Text style={styles.sectionTitle}>Top Contributors</Text>
        <TouchableOpacity style={styles.rewardsButton} onPress={onShowRewards}>
          <Text style={styles.rewardsButtonText}>View Rewards</Text>
        </TouchableOpacity>
      </View>

      <Leaderboard 
        leaderboard={leaderboard}
        currentUserId={currentUserId}
        loading={false}
      />
    </View>
  );
};

const styles = {
  section: { 
    padding: scale(16) 
  },
  leaderboardHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: scale(12) 
  },
  sectionTitle: {
    fontSize: scale(18),
    color: "#709775",
    fontWeight: "bold",
    marginBottom: scale(8),
    textAlign: "center",
  },
  rewardsButton: { 
    backgroundColor: "#415D43", 
    paddingVertical: scale(6), 
    paddingHorizontal: scale(12), 
    borderRadius: scale(8) 
  },
  rewardsButtonText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: scale(12) 
  },
};

export default LeaderboardTab;