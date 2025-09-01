import React, { useEffect, useState } from "react";
import { 
  View, Image, TouchableOpacity, Modal, StyleSheet, ScrollView, Text 
} from "react-native";
import { avatarsRepository } from "../repositories/avatarsRepository";
import { purchasesRepository } from "../repositories/purchasesRepository";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import BuyAvatar from "./BuyAvatar";

const AvatarPicker = ({ visible, onClose, onSelect }) => {
  const [avatars, setAvatars] = useState([]);
  const [purchased, setPurchased] = useState([]);
  const [userId, setUserId] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) setUserId(user.uid);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (visible && userId) fetchAvatars();
  }, [visible, userId]);

  const fetchAvatars = async () => {
    try {
      const allAvatars = await avatarsRepository.getAllAvatars();
      const userPurchases = await purchasesRepository.getUserPurchases(userId);
      const purchasedList = userPurchases.success ? userPurchases.list : [];
      setPurchased(purchasedList);

      const userDoc = await firestore().collection("users").doc(userId).get();
      setCurrentAvatar(userDoc.data()?.avatar || null);

      // Sort owned avatars first
      const sorted = allAvatars.sort((a, b) => {
        const aOwned = a.type === "free" || purchasedList.includes(a.id);
        const bOwned = b.type === "free" || purchasedList.includes(b.id);
        return aOwned === bOwned ? 0 : aOwned ? -1 : 1;
      });

      setAvatars(sorted);
    } catch (err) {
      console.error("Error fetching avatars:", err);
    }
  };

  const isAvailable = avatar => avatar.type === "free" || purchased.includes(avatar.id);

  const handlePurchaseSuccess = async (avatarId) => {
    const user = auth().currentUser;
    if (!user) return;

    setPurchased(prev => [...prev, avatarId]);
    await purchasesRepository.addAvatarPurchase(user.uid, avatarId);
    setSelectedAvatar(null);
  };

  const handleSelectAvatar = async (avatar) => {
    const user = auth().currentUser;
    if (!user) return;

    if (isAvailable(avatar)) {
      try {
        await firestore().collection("users").doc(user.uid).update({
          avatar: avatar.id
        });
        setCurrentAvatar(avatar.id);
        onClose(); // Close the modal after selection
        if (onSelect) {
          onSelect(avatar); // Only call onSelect if it exists
        }
      } catch (err) {
        console.error("Error updating avatar:", err);
      }
    } else {
      setSelectedAvatar(avatar); // Open BuyAvatar modal for unowned avatars
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Choose Your Avatar</Text>
            <ScrollView contentContainerStyle={styles.scroll}>
              {avatars.map(avatar => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarCard,
                    !isAvailable(avatar) && { opacity: 0.5 },
                    avatar.id === currentAvatar && styles.currentAvatarBorder
                  ]}
                  onPress={() => handleSelectAvatar(avatar)}
                >
                  <Image source={{ uri: avatar.imageurl }} style={styles.avatarImage} />
                  {!isAvailable(avatar) && (
                    <Image source={require("../assets/icons/lock.png")} style={styles.lockIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectedAvatar && (
        <BuyAvatar 
          visible={!!selectedAvatar} 
          avatar={selectedAvatar} 
          onClose={() => setSelectedAvatar(null)} 
          onPurchaseSuccess={() => handlePurchaseSuccess(selectedAvatar.id)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    alignSelf: "center",
    color: "#333",
  },
  scroll: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-around" 
  },
  avatarCard: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
    borderRadius: 60,
    backgroundColor: "#fff",
  },
  currentAvatarBorder: {
    borderWidth: 3,
    borderColor: "#415D43",
  },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  lockIcon: { 
    position: "absolute", 
    top: 5, 
    right: 5, 
    width: 28, 
    height: 28 
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "center",
    backgroundColor: "#415D43",
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default AvatarPicker;