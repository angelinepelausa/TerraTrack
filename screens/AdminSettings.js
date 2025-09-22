// screens/AdminSettings.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import HeaderRow from "../components/HeaderRow";

const AdminSettings = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const user = auth().currentUser;
        if (user) {
          setUserId(user.uid);
          setEmail(user.email);

          const doc = await firestore().collection("admins").doc(user.uid).get();
          if (doc.exists) {
            const data = doc.data() || {};
            setUsername(data.username ?? "");
          }
        }
      } catch (error) {
        console.error("Error fetching admin:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Validation", "Username cannot be empty.");
      return;
    }
    if (password && password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      const user = auth().currentUser;
      if (!user) return;

      await firestore().collection("admins").doc(user.uid).update({ username });

      if (password) {
        await user.updatePassword(password);
      }

      Alert.alert("Success", "Settings updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error saving settings:", err);
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.replace("LoginScreen");
    } catch (err) {
      console.error("Error logging out:", err);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header aligned with content */}
      <View style={styles.headerWrapper}>
        <HeaderRow title="Settings" onBackPress={() => navigation.goBack()} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={email}
          editable={false}
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter username"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password"
          placeholderTextColor="#666"
          secureTextEntry
        />

        {password ? (
          <>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#131313" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#131313" },
  headerWrapper: {
    paddingHorizontal: 20, // same as content padding
    paddingTop: 40,
  },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  label: { color: "#ccc", fontSize: 14, marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: "#1F1F1F", padding: 12, borderRadius: 8, color: "#fff", marginBottom: 10 },
  disabledInput: { backgroundColor: "#2A2A2A", color: "#aaa" },
  saveButton: { backgroundColor: "#709775", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 20 },
  disabledButton: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  logoutButton: { backgroundColor: "#b94a48", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 15 },
  logoutButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});

export default AdminSettings;
