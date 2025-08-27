import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { educationalContentRepository } from "../repositories/educationalContentRepository";
import EducationalContentCard from "../components/EducationalContentCard";
import HeaderSearchRow from "../components/HeaderSearchRow";

const AdminEducationalMaterials = () => {
  const navigation = useNavigation();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEducationalContent();
  }, []);

  const fetchEducationalContent = async () => {
    setLoading(true);
    try {
      const contentData = await educationalContentRepository.getAllContent();
      setContent(contentData);
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Content",
      "Are you sure you want to delete this educational content?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await educationalContentRepository.deleteContent(id);
              setContent((prev) => prev.filter((item) => item.id !== id));
            } catch (err) {
              console.error("Error deleting content:", err);
              Alert.alert("Error", "Failed to delete content. Please try again.");
            }
          },
        },
      ]
    );
  };

  const filteredContent = content.filter(
    (item) =>
      (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderSearchRow
        title="Educational Materials"
        onBackPress={() => navigation.goBack()}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPress={() => navigation.navigate("AddEducationalMaterial")}
      />

      {filteredContent.length === 0 ? (
        <Text style={styles.emptyText}>No educational content available</Text>
      ) : (
        <FlatList
          data={filteredContent}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EducationalContentCard
              item={item}
              onPress={() =>
                navigation.navigate("AddEducationalMaterial", { content: item })
              }
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#131313", padding: 16, paddingTop: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingBottom: 20 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 20 },
});

export default AdminEducationalMaterials;
