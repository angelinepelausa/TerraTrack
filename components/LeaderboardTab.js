import React from "react";
import { View } from "react-native";
import Leaderboard from "./Leaderboard";

const LeaderboardTab = ({ leaderboard, progressData, currentUserId }) => {
  return (
    <View style={styles.section}>
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
    flex: 1,
    paddingTop: 10,
  },
};

export default LeaderboardTab;