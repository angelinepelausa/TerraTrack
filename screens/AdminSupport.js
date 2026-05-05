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
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({ 
    category: null, 
    status: null, 
    sortOrder: "latest" 
  });

  useEffect(() => {
    fetchReports("posts", setPosts);
  }, [filters]);

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
            firstCategory: item.reporters?.[0]?.category || "Unknown"
          };
        })
      );

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

    if (filters.category && filters.category.length > 0) {
      filteredData = filteredData.filter(item =>
        item.reporters?.some(reporter =>
          filters.category.includes(reporter.category)
        )
      );
    }

    if (filters.status) {
      const statusLower = filters.status.toLowerCase();
      filteredData = filteredData.filter(item => item.status?.toLowerCase() === statusLower);
    }

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
    const data = posts;
    
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
        placeholder="Search reports"
      />

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
            : "No posts to review."
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
                category: "posts" 
              })}
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

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
    marginTop: 10,
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