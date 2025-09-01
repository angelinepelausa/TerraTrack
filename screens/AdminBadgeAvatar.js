import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import HeaderSearchRow from "../components/HeaderSearchRow";
import { avatarsRepository } from "../repositories/avatarsRepository";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2; // 16 padding * 2 + 16 margin between items

const AdminBadgeAvatarScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("avatars");
  const [avatars, setAvatars] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "avatars") fetchAvatars();
  }, [activeTab]);

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

  const handleAddPress = () => {
    if (activeTab === "avatars") navigation.navigate("AddAvatar", { onSaved: fetchAvatars });
    else alert("Badges not available yet.");
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Avatar",
      "Are you sure you want to delete this avatar?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
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

  const filteredAvatars = avatars.filter((item) =>
    (item.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAvatarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.avatarBox}
      onPress={() => navigation.navigate("AddAvatar", { avatar: item, onSaved: fetchAvatars })}
    >
      {item.imageurl ? (
        <Image source={{ uri: item.imageurl }} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatarImage, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={{ color: "#888" }}>No Image</Text>
        </View>
      )}
      <Text style={styles.avatarName} numberOfLines={1}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeaderSearchRow
        title="Badges & Avatars"
        onBackPress={() => navigation.goBack()}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPress={handleAddPress}
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

      {activeTab === "avatars" ? (
        loading ? (
          <ActivityIndicator size="large" color="#709775" style={{ marginTop: 50 }} />
        ) : filteredAvatars.length === 0 ? (
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
      ) : (
        <Text style={styles.emptyText}>Badges not available yet.</Text>
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

  avatarBox: {
    width: ITEM_WIDTH,
    backgroundColor: "#333",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    padding: 8,
  },
  avatarImage: { width: ITEM_WIDTH - 16, height: ITEM_WIDTH - 16, borderRadius: 12, resizeMode: "cover" },
  avatarName: { color: "#fff", fontWeight: "bold", paddingVertical: 6 },
  deleteText: { color: "red", fontWeight: "bold", marginBottom: 4 },
});

export default AdminBadgeAvatarScreen;
