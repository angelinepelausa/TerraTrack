import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import AvatarPicker from "../components/AvatarPicker";
import { avatarsRepository } from "../repositories/avatarsRepository";
import HeaderRow from "../components/HeaderRow";
import ConfirmationPopup from "../components/ConfirmationPopup";

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
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

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
        showErrorPopup("Error", "Failed to load user data. Please try again.");
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

  const showSuccessPopup = (title, message) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType("success");
    setShowPopup(true);
  };

  const showErrorPopup = (title, message) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType("error");
    setShowPopup(true);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      showErrorPopup("Validation", "Username cannot be empty.");
      return;
    }
    if (password && password !== confirmPassword) {
      showErrorPopup("Validation", "Passwords do not match.");
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

      showSuccessPopup("Success", "Profile updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error saving profile:", err);
      showErrorPopup("Error", err.message || "Something went wrong.");
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
      showSuccessPopup("Success", "Avatar updated successfully.");
    } catch (err) {
      console.error("Error selecting avatar:", err);
      showErrorPopup("Error", "Could not update avatar.");
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      navigation.replace("LoginScreen");
    } catch (err) {
      console.error("Error logging out:", err);
      showErrorPopup("Error", "Failed to log out.");
    }
  };

  const handleEditPreferences = () => {
    navigation.navigate("EditOnboardingScreen");
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
      <ConfirmationPopup
        visible={showPopup}
        onConfirm={() => setShowPopup(false)}
        title={popupTitle}
        message={popupMessage}
        confirmText="OK"
        type={popupType}
      />

      <HeaderRow 
        title="Edit Profile" 
        onBackPress={() => navigation.goBack()} 
      />

      <TouchableOpacity onPress={() => setAvatarModalVisible(true)} style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={{ color: "#888", fontSize: 24 }}>+</Text>
          </View>
        )}
      </TouchableOpacity>

      <AvatarPicker
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        onSelect={handleAvatarSelect}
      />

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#2A2A2A", color: "#aaa" }]}
            value={email}
            editable={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter new password"
            placeholderTextColor="#666"
            secureTextEntry
          />
        </View>

        {password ? (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>
        ) : null}
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.listContainer}>
          <TouchableOpacity style={styles.listItem} onPress={handleEditPreferences}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemText}>Transportation & Lifestyle</Text>
            </View>
            <Text style={styles.chevron}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 30,
    marginTop: 10,
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
  settingsSection: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  input: {
    backgroundColor: "#1F1F1F",
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    width: "100%",
  },
  listContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    color: '#666',
    fontSize: 16,
    fontWeight: '300',
  },
  saveButton: {
    backgroundColor: "#709775",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
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
    width: "100%",
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default SettingsScreen;