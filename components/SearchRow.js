import React from "react";
import { View, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';

const SearchRow = ({ searchValue, onSearchChange, onAddPress, placeholder = "Search" }) => {
  return (
    <View style={styles.searchAddRow}>
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
      <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchAddRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 12 
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 25,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: { 
    width: 18, 
    height: 18, 
    marginRight: 6, 
    tintColor: "#709775" 
  },
  searchInput: { 
    flex: 1, 
    color: "#fff", 
    fontSize: 14 
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 25,
    backgroundColor: "#709775",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});

export default SearchRow;
