// screens/AdminReferral.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { referralRepository } from "../repositories/referralRepository";
import HeaderRow from "../components/HeaderRow";

const AdminReferral = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    referee: { terraCoins: "", terraPoints: "" },
    referrer: { terraCoins: "", terraPoints: "" },
    maxInvites: "",
    goalTasks: "",
    goalEducational: "",
    goalWeeklyQuiz: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await referralRepository.getSettings();
        if (data) setSettings(data);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to load referral settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value, subfield) => {
    if (subfield) {
      setSettings((prev) => ({
        ...prev,
        [field]: { ...prev[field], [subfield]: value },
      }));
    } else {
      setSettings((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        referee: {
          terraCoins: Number(settings.referee.terraCoins),
          terraPoints: Number(settings.referee.terraPoints),
        },
        referrer: {
          terraCoins: Number(settings.referrer.terraCoins),
          terraPoints: Number(settings.referrer.terraPoints),
        },
        maxInvites: Number(settings.maxInvites),
        goalTasks: Number(settings.goalTasks),
        goalEducational: Number(settings.goalEducational),
        goalWeeklyQuiz: Number(settings.goalWeeklyQuiz),
      };
      await referralRepository.updateSettings(data);
      Alert.alert("Success", "Referral settings updated.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

  const renderRewardRow = (label, values, onChange) => (
    <View style={styles.rewardRow}>
      <Text style={[styles.rewardLabel, { flex: 1 }]}>{label}</Text>
      <TextInput
        style={[styles.rewardInput, { flex: 1, textAlign: "center" }]}
        keyboardType="numeric"
        value={values.terraCoins?.toString()}
        onChangeText={(text) => onChange("terraCoins", text)}
      />
      <TextInput
        style={[styles.rewardInput, { flex: 1, textAlign: "center" }]}
        keyboardType="numeric"
        value={values.terraPoints?.toString()}
        onChangeText={(text) => onChange("terraPoints", text)}
      />
    </View>
  );

  // ✅ Updated to show labels above input fields
  const renderInputField = (label, value, onChange) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={value?.toString()}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#888"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerWrapper}>
        <HeaderRow title="Referral Settings" onBackPress={() => navigation.goBack()} />
      </View>

      <View style={styles.content}>
        {/* Rewards Table */}
        <Text style={styles.sectionHeader}>Rewards</Text>
        <View style={styles.rewardHeaderRow}>
          <Text style={[styles.rewardLabel, { flex: 1 }]}></Text>
          <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>TerraCoins</Text>
          <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>TerraPoints</Text>
        </View>
        {renderRewardRow("Referee", settings.referee, (key, value) =>
          handleChange("referee", value, key)
        )}
        {renderRewardRow("Referrer", settings.referrer, (key, value) =>
          handleChange("referrer", value, key)
        )}

        {/* Goals */}
        <Text style={[styles.sectionHeader, { marginTop: 25 }]}>Goals</Text>
        {renderInputField("Maximum Invites", settings.maxInvites, (text) =>
          handleChange("maxInvites", text)
        )}
        {renderInputField("Tasks", settings.goalTasks, (text) =>
          handleChange("goalTasks", text)
        )}
        {renderInputField("Educational Materials", settings.goalEducational, (text) =>
          handleChange("goalEducational", text)
        )}
        {renderInputField("Weekly Quizzes", settings.goalWeeklyQuiz, (text) =>
          handleChange("goalWeeklyQuiz", text)
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#131313" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#131313" },
  headerWrapper: { paddingHorizontal: 20, paddingTop: 40 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  sectionHeader: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 12 },

  rewardHeaderRow: { flexDirection: "row", marginBottom: 5 },
  rewardRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  rewardLabel: { flex: 1, color: "#CCCCCC", fontWeight: "600" },
  rewardInput: {
    flex: 1,
    backgroundColor: "#1F1F1F",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
  },

  // ✅ Labeled input field styles
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#CCCCCC",
    fontWeight: "600",
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#1F1F1F",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
  },

  saveButton: {
    backgroundColor: "#709775",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});

export default AdminReferral;
