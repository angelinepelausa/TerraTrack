import React from "react";
import { View, Text, TouchableOpacity, Image, TextInput, StyleSheet } from "react-native";

const HeaderSearchRow = ({
  title,
  onBackPress,
  searchValue,
  onSearchChange,
  onAddPress,
}) => {
  return (
    <>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>{title}</Text>
        <TouchableOpacity onPress={onBackPress}>
          <Image
            source={require("../assets/icons/back.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchAddRow}>
        <View style={styles.searchBar}>
          <Image
            source={require("../assets/images/Search.png")}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#131313"
            value={searchValue}
            onChangeText={onSearchChange}
          />
        </View>
        <TouchableOpacity style={styles.filterCircle} onPress={onAddPress}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backIcon: { width: 40, height: 40, resizeMode: "contain" },
  headerText: { fontSize: 22, fontWeight: "bold", color: "#709775" },

  searchAddRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#CCCCCC",
    borderRadius: 25,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: { width: 18, height: 18, marginRight: 6, tintColor: "#131313" },
  searchInput: { flex: 1, color: "#131313", fontSize: 14 },

  filterCircle: {
    width: 42,
    height: 42,
    borderRadius: 25,
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  addButtonText: { color: "#131313", fontWeight: "500", fontSize: 12 },
});

export default HeaderSearchRow;
