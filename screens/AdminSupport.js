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
import SearchFilter from "../components/SearchFilter";
import ReportFilterModal from "../components/ReportFilterModal";
import ReportCard from "../components/ReportCard";
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
  const [filters, setFilters] = useState({ 
    category: null, 
    status: null, 
    sortOrder: "latest" 
  });

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
        .collection("items");

      const snapshot = await query.get();

      let data = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const item = doc.data();
          // Map userId → username
          let username = "Unknown User";
          if (item.originalData?.userId) {
            const userDoc = await firestore().collection("users").doc(item.originalData.userId).get();
            if (userDoc.exists) {
              username = userDoc.data().username || "Unknown User";
            }
          }
          return { 
            id: doc.id, 
            username, 
            ...item,
            // Add helper fields for filtering
            firstCategory: item.reporters?.[0]?.category || "Unknown"
          };
        })
      );

      // Apply filters on client side
      data = applyFilters(data, filters);

      setState(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

    const applyFilters = (data, filters) => {
    let filteredData = [...data];

    // Category (multi-select)
    if (filters.category && filters.category.length > 0) {
      filteredData = filteredData.filter(item =>
        item.reporters?.some(reporter =>
          filters.category.includes(reporter.category)
        )
      );
    }

    // Status (single-select)
    if (filters.status) {
      const statusLower = filters.status.toLowerCase();
      filteredData = filteredData.filter(item => item.status?.toLowerCase() === statusLower);
    }

    // Sort by createdAt
    filteredData.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return filters.sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });

    return filteredData;
  };

  const handleApplyFilter = (appliedFilters) => {
    setFilters(appliedFilters);
  };

  const getFilteredData = () => {
    const data = activeTab === "posts" ? posts : verifications;
    
    // Apply search filter
    return data.filter((item) =>
      (item.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.firstCategory || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.itemId || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredData = getFilteredData();

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

      {/* Filter Status Display */}
      {(filters.category || filters.status) && (
        <View style={styles.filterStatus}>
          <Text style={styles.filterStatusText}>
            Filters: 
            {filters.category && ` Category: ${filters.category}`}
            {filters.status && ` Status: ${filters.status}`}
          </Text>
          <TouchableOpacity 
            onPress={() => setFilters({ category: null, status: null, sortOrder: "latest" })}
            style={styles.clearFilterButton}
          >
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#709775" style={{ marginTop: 50 }} />
      ) : filteredData.length === 0 ? (
        <Text style={styles.emptyText}>
          {searchQuery || filters.category || filters.status 
            ? "No items match your search or filters." 
            : `No ${activeTab} to review.`
          }
        </Text>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReportCard 
              item={item} 
              onPress={() => navigation.navigate("AdminPostDetailScreen", { 
                reportId: item.id,
                category: activeTab 
              })}
            />
          )}
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
  filterStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  filterStatusText: {
    color: "#709775",
    fontSize: 12,
    flex: 1,
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#FF4D4D",
    borderRadius: 12,
  },
  clearFilterText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default AdminSupport;