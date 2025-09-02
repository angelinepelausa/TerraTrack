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
  Alert,
} from "react-native";
import {
  getLeaderboardConfig,
  saveOrUpdatePendingConfig,
  deletePendingConfig,
  applyPendingConfigIfNeeded,
} from "../repositories/leaderboardRepository";
import Toast from "../components/Toast";
import { useNavigation } from "@react-navigation/native";
import { computeWeeklyCycle } from "../utils/leaderboardUtils";

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

  useEffect(() => {
    const init = async () => {
      await applyPendingConfigIfNeeded();
      const cfg = await getLeaderboardConfig();
      setConfig((prev) => ({ ...prev, ...cfg }));

      const { start, end, timeLeft } = computeWeeklyCycle();
      setCycle({ start, end, timeLeft });
    };
    init();
  }, []);

  const handleRewardChange = (rankKey, type, value, isPending = false) => {
    if (isPending) {
      const newPending = {
        ...config.pendingConfig,
        rewards: {
          ...config.pendingConfig.rewards,
          [rankKey]: {
            ...config.pendingConfig.rewards[rankKey],
            [type]: Number(value) || 0,
          },
        },
      };
      setConfig((prev) => ({ ...prev, pendingConfig: newPending }));
    } else {
      const newRewards = {
        ...config.rewards,
        [rankKey]: {
          ...config.rewards[rankKey],
          [type]: Number(value) || 0,
        },
      };
      setConfig((prev) => ({ ...prev, rewards: newRewards }));
    }
  };

  const isSameConfig = (cfg1, cfg2) => {
    if (!cfg1 || !cfg2) return false;
    return JSON.stringify(cfg1) === JSON.stringify(cfg2);
  };

  const handleSavePending = () => {
    if (isSameConfig(config.pendingConfig.rewards, config.rewards)) {
      setToastMessage("Configurations are the same. Nothing to save.");
      setToastVisible(true);
      return;
    }

    Alert.alert(
      "Confirm Update",
      "Are you sure you want to update the pending configuration?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Update",
          onPress: async () => {
            setToastMessage("Updating pending configuration...");
            setToastVisible(true);
            try {
              await saveOrUpdatePendingConfig(config.pendingConfig.rewards);
              const cfg = await getLeaderboardConfig();
              setConfig((prev) => ({ ...prev, ...cfg }));
              setToastMessage("Pending configuration saved/updated!");
            } catch (err) {
              console.error(err);
              setToastMessage("Error saving pending configuration.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeletePending = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete the pending configuration?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          onPress: async () => {
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
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSaveCurrent = async () => {
    if (isSameConfig(config.rewards, config.pendingConfig?.rewards)) {
      setToastMessage("Configurations are the same. Nothing to save.");
      setToastVisible(true);
      return;
    }

    setToastMessage("Saving current rewards as pending...");
    setToastVisible(true);

    try {
      await saveOrUpdatePendingConfig(config.rewards);
      const cfg = await getLeaderboardConfig();
      setConfig((prev) => ({ ...prev, ...cfg }));
      setToastMessage("Rewards saved as PENDING. Will apply on next cycle.");
    } catch (err) {
      console.error(err);
      setToastMessage("Error saving configuration.");
    }
  };

  const handleSaveCurrentWithConfirm = () => {
    Alert.alert(
      "Confirm Save",
      "Are you sure you want to save the current rewards as pending? They will apply on the next cycle.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Save", onPress: handleSaveCurrent },
      ],
      { cancelable: true }
    );
  };

  const rankOptions = ["top1", "top2", "top3", "top4to10", "top11plus"];

  const formatDate = (date) =>
    date
      ? date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
      : "";

  const togglePending = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPendingExpanded(!pendingExpanded);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Leaderboard Settings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require("../assets/icons/back.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Cycle Info */}
      <Text style={styles.label}>Current Weekly Cycle:</Text>
      <Text style={styles.cycleEndText}>
        {formatDate(cycle.start)} → {formatDate(cycle.end)}
      </Text>
      <Text style={[styles.cycleEndText, { color: "#709775" }]}>
        Time left before reset: {cycle.timeLeft}
      </Text>

      {/* Current Config Form */}
      <Text style={styles.header}>Rewards Configuration</Text>
      <View style={styles.rewardHeaderRow}>
        <Text style={[styles.rewardLabel, { flex: 1 }]}></Text>
        <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>
          TerraCoins
        </Text>
        <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>
          TerraPoints
        </Text>
      </View>
      {rankOptions.map((rankKey) => {
        let displayLabel = "";
        switch (rankKey) {
          case "top1": displayLabel = "Top 1"; break;
          case "top2": displayLabel = "Top 2"; break;
          case "top3": displayLabel = "Top 3"; break;
          case "top4to10": displayLabel = "Top 4-10"; break;
          case "top11plus": displayLabel = "Top 11+"; break;
        }
        return (
          <View key={rankKey} style={styles.rewardRow}>
            <Text style={styles.rewardLabel}>{displayLabel}</Text>
            <TextInput
              style={[styles.rewardInput, { textAlign: "center" }]}
              keyboardType="numeric"
              value={String(config.rewards?.[rankKey]?.terraCoins || 0)}
              onChangeText={(text) =>
                handleRewardChange(rankKey, "terraCoins", text)
              }
            />
            <TextInput
              style={[styles.rewardInput, { textAlign: "center" }]}
              keyboardType="numeric"
              value={String(config.rewards?.[rankKey]?.terraPoints || 0)}
              onChangeText={(text) =>
                handleRewardChange(rankKey, "terraPoints", text)
              }
            />
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "#709775", marginVertical: 20 }]}
        onPress={handleSaveCurrentWithConfirm}
      >
        <Text style={styles.actionText}>Save</Text>
      </TouchableOpacity>

      {/* Pending Config Section */}
      {config.pendingConfig && (
        <>
          <Text style={[styles.header, { marginTop: 20 }]}>Pending Configuration</Text>
          <TouchableOpacity style={styles.pendingContainer} onPress={togglePending}>
            <Text style={styles.pendingDate}>
              {formatDate(cycle.end ? new Date(cycle.end.getTime() + 1000) : null)}
            </Text>
            <Text style={styles.pendingArrow}>{pendingExpanded ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {pendingExpanded && (
            <View style={styles.pendingDetails}>
              <View style={styles.rewardHeaderRow}>
                <Text style={[styles.rewardLabel, { flex: 1 }]}></Text>
                <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>
                  TerraCoins
                </Text>
                <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>
                  TerraPoints
                </Text>
              </View>
              {rankOptions.map((rankKey) => {
                let displayLabel = "";
                switch (rankKey) {
                  case "top1": displayLabel = "Top 1"; break;
                  case "top2": displayLabel = "Top 2"; break;
                  case "top3": displayLabel = "Top 3"; break;
                  case "top4to10": displayLabel = "Top 4-10"; break;
                  case "top11plus": displayLabel = "Top 11+"; break;
                }
                return (
                  <View key={rankKey} style={styles.rewardRow}>
                    <Text style={[styles.rewardLabel, { color: "#709775" }]}>{displayLabel}</Text>
                    <TextInput
                      style={[styles.rewardInput, { flex: 1, textAlign: "center", color: "#fff" }]}
                      keyboardType="numeric"
                      value={String(config.pendingConfig.rewards?.[rankKey]?.terraCoins ?? 0)}
                      onChangeText={(text) =>
                        handleRewardChange(rankKey, "terraCoins", text, true)
                      }
                    />
                    <TextInput
                      style={[styles.rewardInput, { flex: 1, textAlign: "center", color: "#fff" }]}
                      keyboardType="numeric"
                      value={String(config.pendingConfig.rewards?.[rankKey]?.terraPoints ?? 0)}
                      onChangeText={(text) =>
                        handleRewardChange(rankKey, "terraPoints", text, true)
                      }
                    />
                  </View>
                );
              })}

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#709775", flex: 1, marginRight: 10 }]}
                  onPress={handleSavePending}
                >
                  <Text style={styles.actionText}>Update Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#CC3A3A", flex: 1 }]}
                  onPress={handleDeletePending}
                >
                  <Text style={styles.actionText}>Delete Pending</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerText: { fontSize: 22, fontWeight: "bold", color: "#709775" },
  backIcon: { width: 40, height: 40, resizeMode: "contain", tintColor: "#709775" },
  label: { fontSize: 16, color: "#CCCCCC", marginTop: 15, marginBottom: 5 },
  cycleEndText: { color: "#fff", marginBottom: 10 },
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
  actionButton: { padding: 12, borderRadius: 15, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  pendingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1E1E1E",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  pendingDate: { color: "#709775", fontWeight: "600", fontSize: 16 },
  pendingArrow: { color: "#709775", fontWeight: "600", fontSize: 16 },
  pendingDetails: { marginTop: 10, marginBottom: 50, padding: 12, backgroundColor: "#222", borderRadius: 12 },
  header: { fontSize: 18, fontWeight: "bold", color: "#CCCCCC", marginTop: 20, marginBottom: 10 },
});

export default AdminLeaderboard;
