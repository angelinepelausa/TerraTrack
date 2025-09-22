// screens/SettingsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import AvatarPicker from "../components/AvatarPicker";
import { avatarsRepository } from "../repositories/avatarsRepository";
import HeaderRow from "../components/HeaderRow"; // Import HeaderRow component

const SettingsScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarId, setAvatarId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = auth().currentUser;
        if (user) {
          setUserId(user.uid);
          setEmail(user.email);

          const doc = await firestore().collection("users").doc(user.uid).get();
          if (doc.exists) {
            const data = doc.data();
            setUsername(data.username || "");
            if (data.avatar) {
              setAvatarId(data.avatar);
              fetchAvatarUrl(data.avatar);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const fetchAvatarUrl = async (avatarId) => {
    try {
      const avatarDoc = await avatarsRepository.getAvatarById(avatarId);
      if (avatarDoc?.imageurl) setAvatarUrl(avatarDoc.imageurl);
    } catch (err) {
      console.error("Error fetching avatar URL:", err);
    }
  };

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

      await firestore().collection("users").doc(user.uid).update({
        username,
        ...(avatarId ? { avatar: avatarId } : {}),
      });

      if (password) {
        await user.updatePassword(password);
      }

      Alert.alert("Success", "Profile updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (avatar) => {
    try {
      if (!userId) return;
      setAvatarId(avatar.id);
      fetchAvatarUrl(avatar.id);
      setAvatarModalVisible(false);
    } catch (err) {
      console.error("Error selecting avatar:", err);
      Alert.alert("Error", "Could not update avatar.");
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
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Row with Back Button */}
      <HeaderRow 
        title="Edit Profile" 
        onBackPress={() => navigation.goBack()} 
      />

      {/* Avatar */}
      <TouchableOpacity onPress={() => setAvatarModalVisible(true)} style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ color: "#888" }}>+</Text>
          </View>
        )}
      </TouchableOpacity>

      <AvatarPicker
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        onSelect={handleAvatarSelect}
      />

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, { backgroundColor: "#2A2A2A", color: "#aaa" }]}
        value={email}
        editable={false}
      />

      {/* Username */}
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
        placeholderTextColor="#666"
      />

      {/* Password */}
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

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#131313",
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#131313",
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10, // Added some top margin after the header
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  label: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  input: {
    backgroundColor: "#1F1F1F",
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    marginBottom: 10,
    width: "100%",
  },
  saveButton: {
    backgroundColor: "#709775",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#b94a48",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default SettingsScreen;