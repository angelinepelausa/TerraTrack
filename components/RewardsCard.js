// screens/CommunityProgressScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
} from "react-native";
import { vScale, scale } from "../utils/scaling";
import { getCommunityProgress, getCommunityLeaderboard } from "../repositories/communityProgressRepository";
import RankedAvatar from "../components/RankedAvatar";
import HeaderRow from "../components/HeaderRow";
import ProgressBar from "../components/ProgressBar";
import RewardsCard from "../components/RewardsCard"; // ✅ use your RewardsCard
import Crown from "../assets/images/Crown.png";

const { height } = Dimensions.get("window");

const CommunityProgressScreen = () => {
  const [progressData, setProgressData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progress, topUsers] = await Promise.all([
        getCommunityProgress(),
        getCommunityLeaderboard(),
      ]);
      setProgressData(progress);
      setLeaderboard(topUsers || []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentProgress = () => {
    if (!progressData) {
      return (
        <View style={styles.centeredSection}>
          <Text style={styles.emptyText}>No progress data available</Text>
        </View>
      );
    }

    const { title, description, current, goal, image, endDate } = progressData;
    const daysLeft = endDate
      ? Math.max(
          Math.floor((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24)),
          0
        )
      : 0;
    const progressPercentage = goal > 0 ? (current / goal) * 100 : 0;

    return (
      <View style={styles.section}>
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Title / Desc / Time outside the box */}
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.timeLeft}>
          Time remaining: {daysLeft} day{daysLeft !== 1 ? "s" : ""}
        </Text>

        {/* Progress Box */}
        <View style={styles.infoCard}>
          <Text style={styles.progressHeader}>Community Progress</Text>
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
        </View>
      </View>
    );
  };

  const renderLeaderboard = () => {
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3, 10);

    return (
      <View style={styles.section}>
        <View style={styles.leaderboardHeader}>
          <Text style={styles.sectionTitle}>Top Contributors</Text>
          <TouchableOpacity
            style={styles.rewardsButton}
            onPress={() => setShowRewards(true)}
          >
            <Text style={styles.rewardsButtonText}>View Rewards</Text>
          </TouchableOpacity>
        </View>

        {/* Podium */}
        {top3.length > 0 && (
          <View style={styles.podium}>
            {top3[1] && (
              <View style={[styles.podiumItem, styles.secondPlace]}>
                <RankedAvatar user={top3[1]} rank={2} />
              </View>
            )}
            {top3[0] && (
              <View style={[styles.podiumItem, styles.firstPlace]}>
                <Image source={Crown} style={styles.crown} />
                <RankedAvatar user={top3[0]} rank={1} />
              </View>
            )}
            {top3[2] && (
              <View style={[styles.podiumItem, styles.thirdPlace]}>
                <RankedAvatar user={top3[2]} rank={3} />
              </View>
            )}
          </View>
        )}

        {/* Rest of leaderboard */}
        {rest.length > 0 && (
          <View style={styles.leaderboardList}>
            {rest.map((item, index) => (
              <View key={item.id} style={styles.leaderboardItem}>
                <Text style={styles.rankBadge}>{index + 4}</Text>
                <Image
                  source={require("../assets/images/Avatar.png")}
                  style={styles.avatarSmall}
                />
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.points}>{item.terraPoints} pts</Text>
              </View>
            ))}
          </View>
        )}

        {leaderboard.length === 0 && (
          <Text style={styles.emptyText}>No leaderboard data available</Text>
        )}
      </View>
    );
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
      {/* Header */}
      <View style={styles.headerWrapper}>
        <HeaderRow title="Community Impact" />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["current", "leaderboard"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.activeTabText]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "current" && renderCurrentProgress()}
        {activeTab === "leaderboard" && renderLeaderboard()}
      </ScrollView>

      {/* Rewards Modal */}
      <Modal visible={showRewards} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Leaderboard Rewards</Text>

            {/* ✅ Use RewardsCard component */}
            {progressData?.rewards && (
              <RewardsCard rewards={progressData.rewards} />
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRewards(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  headerWrapper: { paddingHorizontal: scale(16), marginTop: scale(8) },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: scale(30) },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    marginBottom: scale(16),
    marginTop: scale(8),
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

  // Sections
  section: { padding: scale(16) },
  centeredSection: {
    padding: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: scale(18),
    color: "#709775",
    fontWeight: "bold",
    marginBottom: scale(8),
    textAlign: "center",
  },

  // Cards
  infoCard: {
    backgroundColor: "#CCCCCC", // ✅ changed color
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: scale(16),
  },
  description: {
    color: "#CCCCCC",
    fontSize: scale(14),
    marginBottom: scale(8),
    lineHeight: scale(20),
    textAlign: "center",
  },
  timeLeft: {
    color: "#CCCCCC",
    fontSize: scale(12),
    marginBottom: scale(12),
    fontStyle: "italic",
    textAlign: "center",
  },

  // Progress
  progressHeader: {
    fontWeight: "bold",
    fontSize: scale(16),
    color: "#000",
    textAlign: "center",
  },
  progressTitle: {
    fontWeight: "600",
    fontSize: scale(14),
    marginTop: scale(8),
    marginBottom: scale(12),
    color: "#000",
    textAlign: "center",
  },

  // Image
  image: {
    width: "100%",
    height: scale(200),
    borderRadius: scale(12),
    marginBottom: scale(16),
  },

  // Leaderboard
  leaderboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(12),
  },
  rewardsButton: {
    backgroundColor: "#415D43",
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
    borderRadius: scale(8),
  },
  rewardsButtonText: { color: "#fff", fontWeight: "600", fontSize: scale(12) },
  podium: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    marginBottom: scale(20),
    paddingHorizontal: scale(10),
  },
  podiumItem: { alignItems: "center", flex: 1 },
  firstPlace: { marginBottom: scale(20) },
  secondPlace: { marginTop: scale(30) },
  thirdPlace: { marginTop: scale(30) },
  crown: {
    width: scale(35),
    height: scale(35),
    resizeMode: "contain",
    position: "absolute",
    top: scale(-5),
    zIndex: 2,
  },
  leaderboardList: {
    backgroundColor: "#111D13",
    borderRadius: scale(12),
    padding: scale(16),
    marginTop: scale(10),
  },
  leaderboardItem: {
    flexDirection: "row",
    backgroundColor: "#D9D9D9",
    borderRadius: scale(8),
    padding: scale(12),
    marginVertical: scale(6),
    alignItems: "center",
  },
  rankBadge: {
    fontWeight: "bold",
    color: "#131313",
    backgroundColor: "#D9D9D9",
    borderRadius: scale(8),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    marginRight: scale(12),
    minWidth: scale(30),
    textAlign: "center",
    fontSize: scale(12),
  },
  avatarSmall: {
    width: scale(40),
    height: scale(40),
    resizeMode: "contain",
    marginRight: scale(12),
    borderRadius: scale(20),
  },
  username: { fontWeight: "bold", flex: 1, color: "#131313", fontSize: scale(14) },
  points: { fontWeight: "bold", color: "#131313", fontSize: scale(12) },

  // Rewards Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(16),
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: scale(12),
    padding: scale(20),
    width: "90%",
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#fff",
    marginBottom: scale(16),
    textAlign: "center",
  },
  closeButton: {
    marginTop: scale(20),
    backgroundColor: "#415D43",
    paddingVertical: scale(10),
    borderRadius: scale(8),
  },
  closeButtonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
    fontSize: scale(14),
  },

  // Empty states
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: scale(20),
    fontStyle: "italic",
    fontSize: scale(14),
  },
});

export default CommunityProgressScreen;
