import React from "react";
import { View, ScrollView } from "react-native";
import CommunityLeaderboard from "./CommunityLeaderboard";

const LeaderboardTab = ({ leaderboard, progressData, currentUserId }) => {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <CommunityLeaderboard 
          leaderboard={leaderboard}
          currentUserId={currentUserId}
          loading={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#131313',
    marginTop: 10,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 15, 
  },
  section: { 
    flex: 1,
    paddingTop: 10,
    paddingBottom: 20, 
  },
};

export default LeaderboardTab;