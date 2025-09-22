// components/HeaderRow.js
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

const HeaderRow = ({ title, onBackPress }) => {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.headerText}>{title}</Text>
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Image
          source={require("../assets/icons/back.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#709775" 
  },
  backButton: {
    padding: 8,
  },
  backIcon: { 
    width: 40, 
    height: 40, 
    resizeMode: "contain", 
    tintColor: "#709775" 
  },
});

export default HeaderRow;