import React from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const gridItems = [
  "User Management",
  "Educational Materials",
  "Weekly Quiz",
  "Task Library",
  "Community Progress",
  "Badge and Avatar",
  "Leaderboard",
  "Referral",
  "Settings",
  "Support",
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
            style={styles.gridItem}
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
    padding: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#709775", 
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: (width - 60) / 2, 
    height: 120,
    backgroundColor: "#1f1f1f", 
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  gridText: {
    color: "#ffffff", 
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AdminDashboard;
