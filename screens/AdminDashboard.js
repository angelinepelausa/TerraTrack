import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { scale, vScale } from '../utils/scaling';

const gridItems = [
  "User Management",
  "Educational Materials",
  "Weekly Quiz",
  "Task Library",
  "Community Progress",
  "Badge and Avatar",
  "Leaderboard",
  "Referral",
  "Support",
  "Partners",
  "Settings",
];

const AdminDashboard = () => {
  const navigation = useNavigation();

  const handlePress = (item) => {
    switch (item) {
      case "User Management":
        navigation.navigate("AdminUserManagement");
        break;
      case "Educational Materials":
        navigation.navigate("AdminEducationalMaterials");
        break;
      case "Weekly Quiz":
        navigation.navigate("AdminWeeklyQuiz");
        break;
      case "Task Library":
        navigation.navigate("AdminTaskLibrary");
        break;
      case "Community Progress":
        navigation.navigate("AdminCommunityProgress");
        break;
      case "Badge and Avatar":
        navigation.navigate("AdminBadgeAvatar");
        break;
      case "Leaderboard":
        navigation.navigate("AdminLeaderboard");
        break;
      case "Referral":
        navigation.navigate("AdminReferral");
        break;
      case "Settings":
        navigation.navigate("AdminSettings");
        break;
      case "Support":
        navigation.navigate("AdminSupport");
        break;
      case "Partners":
        navigation.navigate("AdminPartnersVoucher");
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      <View style={styles.gridContainer}>
        {gridItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.gridItem,
              item === "Settings" && styles.fullWidthItem
            ]}
            onPress={() => handlePress(item)}
          >
            <Text style={styles.gridText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131313", 
    padding: scale(20),
    paddingTop: vScale(50),
  },
  header: {
    fontSize: scale(22),
    fontWeight: "bold",
    color: "#709775", 
    marginBottom: vScale(20),
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: scale(165), 
    height: vScale(100),
    backgroundColor: "#1f1f1f", 
    borderRadius: scale(25),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vScale(15),
  },
  fullWidthItem: {
    width: scale(350),
  },
  gridText: {
    color: "#ffffff", 
    fontSize: scale(14),
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AdminDashboard;