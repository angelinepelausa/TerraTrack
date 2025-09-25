import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import firestore from "@react-native-firebase/firestore";
import HeaderRow from "../components/HeaderRow";
import SearchFilter from "../components/SearchFilter"; // new search + filter component
import ReportFilterModal from "../components/ReportFilterModal"; // report filter modal
import { scale } from "../utils/scaling";

const AdminSupport = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // filter modal states
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({ category: null, status: null, sortOrder: "latest" });

  useEffect(() => {
    if (activeTab === "posts") fetchReports("posts", setPosts);
    else if (activeTab === "verifications") fetchReports("verifications", setVerifications);
  }, [activeTab, filters]);

  const fetchReports = async (category, setState) => {
    setLoading(true);
    try {
      let query = firestore()
        .collection("forReview")
        .doc(category)
        .collection("items")
        .orderBy("createdAt", filters.sortOrder === "latest" ? "desc" : "asc");

      const snapshot = await query.get();

      let data = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const item = doc.data();
          // Map userId → username
          let username = "Unknown";
          if (item.userId) {
            const userDoc = await firestore().collection("users").doc(item.userId).get();
            if (userDoc.exists) {
              username = userDoc.data().username || "Unknown";
            }
          }
          return { id: doc.id, username, ...item };
        })
      );

      // Apply category filter
      if (filters.category) {
        data = data.filter((item) => item.category === filters.category);
      }

      // Apply status filter
      if (filters.status) {
        data = data.filter((item) => item.status === filters.status);
      }

      setState(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((item) =>
    (item.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVerifications = verifications.filter((item) =>
    (item.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("AdminPostDetailScreen", { reportId: item.id })
      }
    >
      <Text style={styles.title}>User: {item.username || "Unknown"}</Text>
      <Text style={styles.subtitle}>
        Date:{" "}
        {item.createdAt
          ? new Date(item.createdAt.toDate()).toLocaleString()
          : "N/A"}
      </Text>
      <Text style={styles.subtitle}>Category: {item.category || "N/A"}</Text>
      <Text style={styles.subtitle}>Status: {item.status || "N/A"}</Text>
    </TouchableOpacity>
  );

  const handleApplyFilter = (appliedFilters) => {
    setFilters(appliedFilters);
  };

  return (
    <View style={styles.container}>
      <HeaderRow
        title="Support Center"
        onBackPress={() => navigation.goBack()}
      />

      <SearchFilter
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterPress={() => setFilterVisible(true)}
        placeholder={`Search ${activeTab}...`}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["posts", "verifications"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#709775" style={{ marginTop: 50 }} />
      ) : activeTab === "posts" ? (
        filteredPosts.length === 0 ? (
          <Text style={styles.emptyText}>No posts to review.</Text>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderReportItem}
            contentContainerStyle={styles.listContainer}
          />
        )
      ) : filteredVerifications.length === 0 ? (
        <Text style={styles.emptyText}>No verifications to review.</Text>
      ) : (
        <FlatList
          data={filteredVerifications}
          keyExtractor={(item) => item.id}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Report Filter Modal */}
      <ReportFilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#131313", padding: 16, paddingTop: 40 },

  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
  },
  activeTab: { backgroundColor: "#415D43" },
  tabText: { color: "#bbb", fontWeight: "bold" },
  activeTabText: { color: "#fff" },

  listContainer: { paddingBottom: scale(20) },
  emptyText: { textAlign: "center", color: "#888", marginTop: 20 },

  card: {
    backgroundColor: "#1E1E1E",
    padding: scale(14),
    borderRadius: scale(10),
    marginBottom: scale(12),
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
  title: { fontSize: scale(14), fontWeight: "600", color: "#fff", marginBottom: 4 },
  subtitle: { fontSize: scale(12), color: "#bbb" },
});

export default AdminSupport;
