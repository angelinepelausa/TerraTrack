// screens/CommunityProgressScreen.js
import React, { useState } from "react";
import { View, ActivityIndicator, TouchableOpacity, Text, Modal, Image, Dimensions } from "react-native";
import { scale } from "../utils/scaling";
import { useCommunityProgress } from "../hooks/useCommunityProgress";
import HeaderRow from "../components/HeaderRow";
import CurrentProgressTab from "../components/CurrentProgressTab";
import CommentsTab from "../components/CommentsTab";
import LeaderboardTab from "../components/LeaderboardTab";
import { useNavigation } from "@react-navigation/native";
import TerraCoin from "../assets/images/TerraCoin.png";
import TerraPoint from "../assets/images/TerraPoint.png";

const { height } = Dimensions.get("window");

const CommunityProgressScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("current");
  const [showRewards, setShowRewards] = useState(false);

  const {
    confettiRef,
    progressData,
    leaderboard,
    loading,
    userContribution,
    recentActivity,
    comments,
    currentUserId,
    getTimeMessage,
    handlePostComment,
    handleLikeComment,
    handleLikeReply,
    handleReplyToComment,
    handleDeleteComment,
    handleDeleteReply,
  } = useCommunityProgress();

  

  const renderActiveTab = () => {
    switch (activeTab) {
      case "current":
        return (
          <CurrentProgressTab
            progressData={progressData}
            userContribution={userContribution}
            recentActivity={recentActivity}
            getTimeMessage={getTimeMessage}
            confettiRef={confettiRef}
            style={{ flex: 1 }}
          />
        );
      case "comments":
        return (
          <CommentsTab
            comments={comments}
            onPostComment={handlePostComment}
            onLikeComment={handleLikeComment}
            onLikeReply={handleLikeReply}
            onReplyToComment={handleReplyToComment}
            onDeleteComment={handleDeleteComment}
            onDeleteReply={handleDeleteReply}
            currentUserId={currentUserId}
            style={{ flex: 1 }}
          />
        );
      case "leaderboard":
        return (
          <LeaderboardTab
            leaderboard={leaderboard}
            progressData={progressData}
            onShowRewards={() => setShowRewards(true)}
            currentUserId={currentUserId}
            style={{ flex: 1 }}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#415D43" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <HeaderRow title="Community Impact" onBackPress={() => navigation.goBack()} />
      </View>

      <View style={styles.tabContainer}>
        {["current", "comments", "leaderboard"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === "comments" ? "Feed" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {renderActiveTab()}
      </View>

      <RewardsModal visible={showRewards} onClose={() => setShowRewards(false)} rewards={progressData?.rewards} />
    </View>
  );
};

const RewardsModal = ({ visible, onClose, rewards }) => (
  <Modal visible={visible} transparent animationType="fade">
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={onClose}>
      <View style={styles.rewardsCard}>
        <Text style={styles.modalTitle}>Leaderboard Rewards</Text>
        {rewards &&
          [
            { label: "Top 1", reward: rewards.top1 },
            { label: "Top 2", reward: rewards.top2 },
            { label: "Top 3", reward: rewards.top3 },
            { label: "Top 4-10", reward: rewards.top4to10 },
            { label: "Top 11+", reward: rewards.top11plus },
          ].map((item, index, arr) => (
            <View key={item.label}>
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>{item.label}</Text>
                <View style={styles.rewardMiddle}>
                  <Image source={TerraPoint} style={styles.rewardIcon} />
                  <Text style={styles.rewardText}>{item.reward.terraPoints}</Text>
                </View>
                <View style={styles.rewardRight}>
                  <Text style={styles.rewardText}>{item.reward.terraCoins}</Text>
                  <Image source={TerraCoin} style={styles.rewardIcon} />
                </View>
              </View>
              {index < arr.length - 1 && <View style={styles.rewardDivider} />}
            </View>
          ))}
      </View>
    </TouchableOpacity>
  </Modal>
);

const styles = {
  container: { flex: 1, backgroundColor: "#000" },
  headerWrapper: { paddingHorizontal: scale(16), marginTop: scale(20) },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    padding: scale(2),
  },
  tab: {
    flex: 1,
    padding: scale(12),
    alignItems: "center",
    borderRadius: scale(10),
    justifyContent: "center",
  },
  activeTab: { backgroundColor: "#709775" },
  tabText: {
    color: "#CCCCCC",
    fontWeight: "600",
    fontSize: scale(12),
    textAlign: "center",
  },
  activeTabText: { color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: scale(16) },
  rewardsCard: { width: "90%", padding: scale(20), borderRadius: scale(18), backgroundColor: "#1B2B20" },
  modalTitle: { fontSize: scale(18), fontWeight: "bold", color: "#fff", marginBottom: scale(16), textAlign: "center" },
  rewardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  rewardLabel: { color: "#CCCCCC", fontSize: 14, fontWeight: "bold", width: 80 },
  rewardMiddle: { flexDirection: "row", alignItems: "center", justifyContent: "center", flex: 1 },
  rewardRight: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", flex: 1 },
  rewardIcon: { width: 20, height: 20, marginHorizontal: 4 },
  rewardText: { color: "#CCCCCC", fontSize: 14, fontWeight: "bold" },
  rewardDivider: { height: 1, backgroundColor: "#1E1E1E", marginVertical: 6, opacity: 0.4 },
};

export default CommunityProgressScreen;
