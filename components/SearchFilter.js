import React from "react";
import { View, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";

const SearchFilter = ({ searchValue, onSearchChange, onFilterPress, placeholder = "Search" }) => {
  return (
    <View style={styles.searchRow}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Image
          source={require("../assets/images/Search.png")}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={searchValue}
          onChangeText={onSearchChange}
        />
      </View>

      {/* Filter button */}
      <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
        <View style={styles.filterCircle}>
          <Image
            source={require("../assets/icons/filter.png")}
            style={styles.filterIcon}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 25,
    flex: 1,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    tintColor: "#709775",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  filterButton: {
    marginLeft: 8,
  },
  filterCircle: {
    width: 42,
    height: 42,
    borderRadius: 25,
    backgroundColor: "#709775",
    justifyContent: "center",
    alignItems: "center",
  },
  filterIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
    resizeMode: "contain",
  },
});

export default SearchFilter;
