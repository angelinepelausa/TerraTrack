import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUserFilter } from "../hooks/useUserFilter";
import FilterModal from "../components/FilterModal";

const AdminUserManagement = () => {
  const navigation = useNavigation();
  const users = useUserFilter();
  const [search, setSearch] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(search.toLowerCase())
  );

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <Image
        source={require("../assets/images/Avatar.png")}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>User Management</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require("../assets/icons/back.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Image
            source={require("../assets/images/Search.png")}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#131313"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <View style={styles.filterCircle}>
            <Image
              source={require("../assets/icons/filter.png")}
              style={styles.filterIcon}
            />
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#709775" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingTop: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found</Text>
          }
        />
      )}

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131313",
    padding: 20,
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#709775",
  },
  backIcon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CCCCCC",
    borderRadius: 25,
    flex: 1,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    tintColor: "#131313",
  },
  searchInput: {
    flex: 1,
    color: "#131313",
    fontSize: 14,
  },
  filterButton: {
    marginLeft: 8,
  },
  filterCircle: {
    width: 42,
    height: 42,
    borderRadius: 25,
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },
  filterIcon: {
    width: 24,
    height: 24,
    tintColor: "#131313",
    resizeMode: "contain",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 35,
    height: 35,
    marginRight: 12,
    resizeMode: "contain",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
    color: "#131313",
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: "center",
    color: "#CCC",
    marginTop: 50,
    fontSize: 16,
  },
});

export default AdminUserManagement;