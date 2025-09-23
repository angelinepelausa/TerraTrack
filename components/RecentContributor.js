// components/RecentContributor.js
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { scale } from "../utils/scaling";

const RecentContributor = ({ user }) => (
  <View style={styles.container}>
    <Image
      source={{ uri: user.avatar || "https://via.placeholder.com/40" }}
      style={styles.avatar}
    />
    <Text style={styles.username}>{user.username}</Text>
    <Text style={styles.action}>completed a task!</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", marginVertical: scale(4) },
  avatar: { width: scale(40), height: scale(40), borderRadius: scale(20), marginRight: scale(8) },
  username: { fontWeight: "bold", color: "#fff", fontSize: scale(14), marginRight: scale(4) },
  action: { color: "#CCCCCC", fontSize: scale(12) },
});

export default RecentContributor;
