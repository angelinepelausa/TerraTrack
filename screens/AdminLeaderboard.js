// screens/AdminLeaderboard.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  getLeaderboardConfig,
  saveOrUpdatePendingConfig,
  deletePendingConfig,
  applyPendingConfigIfNeeded,
  getLeaderboard,
} from "../repositories/leaderboardRepository";
import Toast from "../components/Toast";
import { useNavigation } from "@react-navigation/native";
import { computeWeeklyCycle, computeNextWeeklyCycle } from "../utils/leaderboardUtils";
import Leaderboard from "../components/Leaderboard";
import RewardsCard from "../components/RewardsCard";
import { scale } from "../utils/scaling";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AdminLeaderboard = () => {
  const navigation = useNavigation();

  const [config, setConfig] = useState({
    rewards: {
      top1: { terraCoins: 0, terraPoints: 0 },
      top2: { terraCoins: 0, terraPoints: 0 },
      top3: { terraCoins: 0, terraPoints: 0 },
      top4to10: { terraCoins: 0, terraPoints: 0 },
      top11plus: { terraCoins: 0, terraPoints: 0 },
    },
    pendingConfig: null,
  });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [cycle, setCycle] = useState({ start: null, end: null, timeLeft: "" });
  const [pendingExpanded, setPendingExpanded] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await applyPendingConfigIfNeeded();
        const cfg = await getLeaderboardConfig();
        setConfig((prev) => ({ ...prev, ...cfg }));

        const currentCycle = computeWeeklyCycle();
        setCycle(currentCycle);

        const data = await getLeaderboard(10);
        setLeaderboardData(data || []);
      } catch (error) {
        console.error("Error initializing admin leaderboard:", error);
        setToastMessage("Error loading data");
        setToastVisible(true);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    init();
  }, []);

  const handleRewardChange = (rankKey, type, value, isPending = false) => {
    const numericValue = Number(value) || 0;
    if (isPending) {
      if (!config.pendingConfig) return;
      const newPending = {
        ...config.pendingConfig,
        rewards: {
          ...config.pendingConfig.rewards,
          [rankKey]: { ...config.pendingConfig.rewards[rankKey], [type]: numericValue },
        },
      };
      setConfig((prev) => ({ ...prev, pendingConfig: newPending }));
    } else {
      const newRewards = {
        ...config.rewards,
        [rankKey]: { ...config.rewards[rankKey], [type]: numericValue },
      };
      setConfig((prev) => ({ ...prev, rewards: newRewards }));
    }
  };

  const isSameConfig = (cfg1, cfg2) => {
    if (!cfg1 || !cfg2) return false;
    return JSON.stringify(cfg1) === JSON.stringify(cfg2);
  };

  const handleSavePending = async () => {
    if (!config.pendingConfig) return;

    try {
      await saveOrUpdatePendingConfig(config.pendingConfig.rewards);
      const cfg = await getLeaderboardConfig();
      setConfig((prev) => ({ ...prev, ...cfg }));
      setPendingExpanded(false);
      setToastMessage("Pending configuration saved!");
      setToastVisible(true);
    } catch (err) {
      console.error(err);
      setToastMessage("Error saving pending configuration.");
      setToastVisible(true);
    }
  };

  const handleDeletePending = async () => {
    if (!config.pendingConfig) return;

    try {
      await deletePendingConfig();
      setConfig((prev) => ({ ...prev, pendingConfig: null }));
      setPendingExpanded(false);
      setToastMessage("Pending configuration deleted!");
      setToastVisible(true);
    } catch (err) {
      console.error(err);
      setToastMessage("Error deleting pending configuration.");
      setToastVisible(true);
    }
  };

  const handleAddPending = () => {
    const newPending = {
      rewards: {
        top1: { terraCoins: 0, terraPoints: 0 },
        top2: { terraCoins: 0, terraPoints: 0 },
        top3: { terraCoins: 0, terraPoints: 0 },
        top4to10: { terraCoins: 0, terraPoints: 0 },
        top11plus: { terraCoins: 0, terraPoints: 0 },
      },
    };
    setConfig((prev) => ({ ...prev, pendingConfig: newPending }));
    setPendingExpanded(true);
  };

  const togglePending = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPendingExpanded(!pendingExpanded);
  };

  const rankOptions = ["top1", "top2", "top3", "top4to10", "top11plus"];
  const formatDate = (date) =>
    date ? date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "";

  const renderCurrentTab = () => (
    <>
      <Text style={styles.header}>Current Cycle Week</Text>
      <Text style={styles.cycleText}>
        {cycle.start ? `${formatDate(cycle.start)} - ${formatDate(cycle.end)}` : "Loading..."}
      </Text>
      <Text style={styles.cycleText}>Time left: {cycle.timeLeft || "Loading..."}</Text>

      <View style={{ marginTop: scale(16) }}>
        <View style={styles.leaderboardHeader}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          <TouchableOpacity style={styles.rewardsButton} onPress={() => setShowRewardsModal(true)}>
            <Text style={styles.rewardsButtonText}>View Rewards</Text>
          </TouchableOpacity>
        </View>

        {loadingLeaderboard ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#709775" />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : (
          <Leaderboard leaderboard={leaderboardData} loading={loadingLeaderboard} showTitle={false} />
        )}
      </View>
    </>
  );

  const renderUpcomingTab = () => {
    const nextCycle = computeNextWeeklyCycle(cycle.timeLeft);

    if (!config.pendingConfig) {
      return (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: "#CCCCCC", marginBottom: 10 }}>No pending configuration.</Text>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#415D43",
              padding: 10,
              borderRadius: 10,
            }}
            onPress={handleAddPending}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: "#fff", fontWeight: "600" }}>Add Configuration</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <Text style={[styles.header, { marginTop: 20 }]}>Upcoming Cycle Week</Text>
        <Text style={styles.cycleText}>
          {nextCycle.start ? `${formatDate(nextCycle.start)} - ${formatDate(nextCycle.end)}` : "Loading..."}
        </Text>
        <Text style={styles.cycleText}>Time left: {nextCycle.timeLeft || "Loading..."}</Text>

        <TouchableOpacity style={styles.pendingContainer} onPress={togglePending}>
          <Text style={styles.pendingDate}>{formatDate(nextCycle.start)}</Text>
          <Ionicons
            name={pendingExpanded ? "chevron-up-outline" : "chevron-down-outline"}
            size={20}
            color="#709775"
          />
        </TouchableOpacity>

        {pendingExpanded && (
          <View style={styles.pendingDetails}>
            <View style={styles.rewardHeaderRow}>
              <Text style={[styles.rewardLabel, { flex: 1 }]}></Text>
              <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>TerraCoins</Text>
              <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>TerraPoints</Text>
            </View>
            {rankOptions.map((rankKey) => {
              const labels = { top1: "Top 1", top2: "Top 2", top3: "Top 3", top4to10: "Top 4-10", top11plus: "Top 11+" };
              return (
                <View key={rankKey} style={styles.rewardRow}>
                  <Text style={[styles.rewardLabel, { color: "#709775" }]}>{labels[rankKey]}</Text>
                  <TextInput
                    style={[styles.rewardInput, { flex: 1, textAlign: "center", color: "#fff" }]}
                    keyboardType="numeric"
                    value={String(config.pendingConfig.rewards?.[rankKey]?.terraCoins ?? 0)}
                    onChangeText={(text) => handleRewardChange(rankKey, "terraCoins", text, true)}
                  />
                  <TextInput
                    style={[styles.rewardInput, { flex: 1, textAlign: "center", color: "#fff" }]}
                    keyboardType="numeric"
                    value={String(config.pendingConfig.rewards?.[rankKey]?.terraPoints ?? 0)}
                    onChangeText={(text) => handleRewardChange(rankKey, "terraPoints", text, true)}
                  />
                </View>
              );
            })}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
              {!config.pendingConfig.saved ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#709775", flex: 1 }]}
                  onPress={handleSavePending}
                >
                  <Text style={styles.actionText}>Save</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#709775", flex: 1, marginRight: 10 }]}
                    onPress={handleSavePending}
                  >
                    <Ionicons name="pencil-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#CC3A3A", flex: 1 }]}
                    onPress={handleDeletePending}
                  >
                    <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.actionText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Leaderboard Settings</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image source={require("../assets/icons/back.png")} style={styles.backIcon} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {["current", "upcoming"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "current" && renderCurrentTab()}
        {activeTab === "upcoming" && renderUpcomingTab()}

        <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      </ScrollView>

      {/* Rewards Modal */}
      <Modal
        visible={showRewardsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRewardsModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowRewardsModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <RewardsCard rewards={config.rewards} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerText: { fontSize: 22, fontWeight: "bold", color: "#709775" },
  backIcon: { width: 40, height: 40, resizeMode: "contain", tintColor: "#709775" },
  cycleText: { color: "#CCCCCC", marginBottom: 8 },
  rewardHeaderRow: { flexDirection: "row", marginBottom: 5 },
  rewardRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  rewardLabel: { flex: 1, color: "#CCCCCC", fontWeight: "600" },
  rewardInput: {
    flex: 1,
    backgroundColor: "#222",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  actionButton: { padding: 12, borderRadius: 15, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  pendingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1E1E1E",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  pendingDate: { color: "#709775", fontWeight: "600", fontSize: 16 },
  pendingArrow: { color: "#709775", fontWeight: "600", fontSize: 16 },
  pendingDetails: { marginTop: 10, marginBottom: 50, padding: 12, backgroundColor: "#222", borderRadius: 12 },
  header: { fontSize: 18, fontWeight: "bold", color: "#CCCCCC", marginTop: 20, marginBottom: 10 },
  loadingContainer: { alignItems: "center", justifyContent: "center", padding: 40 },
  loadingText: { color: "#CCCCCC", marginTop: 10, fontSize: 16 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
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
  tabText: { color: "#CCCCCC", fontWeight: "600", fontSize: scale(12), textAlign: "center" },
  activeTabText: { color: "#fff" },
  leaderboardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: scale(12) },
  sectionTitle: { fontSize: scale(18), color: "#709775", fontWeight: "bold", marginBottom: scale(8), textAlign: "center" },
  rewardsButton: { backgroundColor: "#415D43", paddingVertical: scale(6), paddingHorizontal: scale(12), borderRadius: scale(8) },
  rewardsButtonText: { color: "#fff", fontWeight: "600", fontSize: scale(12) },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { width: "85%" },
});

export default AdminLeaderboard;
