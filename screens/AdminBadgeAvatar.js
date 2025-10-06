import React, { useState, useEffect } from "react";
import { 
  View, StyleSheet, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions, Alert 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { avatarsRepository } from "../repositories/avatarsRepository";
import { badgesRepository } from "../repositories/badgesRepository";
import HeaderRow from "../components/HeaderRow";
import SearchRow from "../components/SearchRow";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2; // 16 padding * 2 + 16 margin between items

const AdminBadgeAvatarScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("avatars");
  const [avatars, setAvatars] = useState([]);
  const [badges, setBadges] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "avatars") fetchAvatars();
    else if (activeTab === "badges") fetchBadges();
  }, [activeTab]);

  // --- Avatars ---
  const fetchAvatars = async () => {
    setLoading(true);
    try {
      const avatarData = await avatarsRepository.getAllAvatars();
      setAvatars(avatarData);
    } catch (err) {
      console.error("Error fetching avatars:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = (id) => {
    Alert.alert(
      "Delete Avatar",
      "Are you sure you want to delete this avatar?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await avatarsRepository.deleteAvatar(id);
              fetchAvatars();
            } catch (err) {
              console.error("Failed to delete avatar:", err);
            }
          } 
        },
      ]
    );
  };

  const renderAvatarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemBox}
      onPress={() => navigation.navigate("AddAvatar", { avatar: item, onSaved: fetchAvatars })}
    >
      {item.imageurl ? (
        <Image source={{ uri: item.imageurl }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "#888" }}>No Image</Text>
        </View>
      )}
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleDeleteAvatar(item.id)}>
        <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // --- Badges ---
  const fetchBadges = async () => {
    setLoading(true);
    try {
      const badgeData = await badgesRepository.getAllBadges();
      setBadges(badgeData);
    } catch (err) {
      console.error("Error fetching badges:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBadge = (id) => {
    Alert.alert(
      "Delete Badge",
      "Are you sure you want to delete this badge?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await badgesRepository.deleteBadge(id);
              fetchBadges();
            } catch (err) {
              console.error("Failed to delete badge:", err);
            }
          } 
        },
      ]
    );
  };

  const renderBadgeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemBox}
      onPress={() => navigation.navigate("AddBadge", { badge: item, onSaved: fetchBadges })}
    >
      {item.imageurl ? (
        <Image source={{ uri: item.imageurl }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "#888" }}>No Image</Text>
        </View>
      )}
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleDeleteBadge(item.id)}>
        <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // --- Add Button ---
  const handleAddPress = () => {
    if (activeTab === "avatars") {
      navigation.navigate("AddAvatar", { onSaved: fetchAvatars });
    } else if (activeTab === "badges") {
      navigation.navigate("AddBadge", { onSaved: fetchBadges });
    }
  };

  const filteredAvatars = avatars.filter((item) =>
    (item.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBadges = badges.filter((item) =>
    (item.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <HeaderRow
        title="Badges & Avatars"
        onBackPress={() => navigation.goBack()}
      />
      
      <SearchRow
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPress={handleAddPress}
        placeholder={`Search ${activeTab}...`}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["badges", "avatars"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#709775" style={{ marginTop: 50 }} />
      ) : activeTab === "avatars" ? (
        filteredAvatars.length === 0 ? (
          <Text style={styles.emptyText}>No avatars yet.</Text>
        ) : (
          <FlatList
            data={filteredAvatars}
            keyExtractor={(item) => item.id}
            renderItem={renderAvatarItem}
            contentContainerStyle={styles.listContainer}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 16 }}
          />
        )
      ) : filteredBadges.length === 0 ? (
        <Text style={styles.emptyText}>No badges yet.</Text>
      ) : (
        <FlatList
          data={filteredBadges}
          keyExtractor={(item) => item.id}
          renderItem={renderBadgeItem}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 16 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#131313", padding: 16, paddingTop: 40 },

  tabContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, marginHorizontal: 5, borderRadius: 20, backgroundColor: "#333", alignItems: "center" },
  activeTab: { backgroundColor: "#415D43" },
  tabText: { color: "#bbb", fontWeight: "bold" },
  activeTabText: { color: "#fff" },

  listContainer: { paddingBottom: 100 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 20 },

  itemBox: {
    width: ITEM_WIDTH,
    backgroundColor: "#333",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    padding: 8,
  },
  itemImage: { width: ITEM_WIDTH - 16, height: ITEM_WIDTH - 16, borderRadius: 12, resizeMode: "cover" },
  itemName: { color: "#fff", fontWeight: "bold", paddingVertical: 6 },
});

export default AdminBadgeAvatarScreen;
