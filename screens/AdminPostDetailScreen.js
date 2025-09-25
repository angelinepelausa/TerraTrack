import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { scale } from "../utils/scaling";

const AdminPostDetailScreen = ({ route, navigation }) => {
  const { reportId } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("forReview")
      .doc("posts")
      .collection("items")
      .doc(reportId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setReport({ id: doc.id, ...doc.data() });
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching report detail:", error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [reportId]);

  const handleAction = async (action) => {
    try {
      if (!report) return;

      switch (action) {
        case "safe":
          await firestore()
            .collection("forReview")
            .doc("posts")
            .collection("items")
            .doc(report.id)
            .update({ hidden: false, totalReports: 0 });
          Alert.alert("Marked as Safe", "The post is now visible again.");
          break;

        case "warn":
          // Example: increment warning count logic
          await firestore()
            .collection("users")
            .doc(report.userId)
            .update({
              warnings: firestore.FieldValue.increment(1),
            });
          Alert.alert("User Warned", "Warning has been issued to the user.");
          break;

        case "delete":
          await firestore()
            .collection("forReview")
            .doc("posts")
            .collection("items")
            .doc(report.id)
            .delete();
          Alert.alert("Deleted", "The reported post has been deleted.");
          navigation.goBack();
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Admin action error:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Report not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: scale(20) }}>
      <Text style={styles.title}>Reported Post</Text>
      <Text style={styles.label}>User ID:</Text>
      <Text style={styles.value}>{report.userId || "Unknown"}</Text>

      <Text style={styles.label}>Date:</Text>
      <Text style={styles.value}>
        {report.createdAt
          ? new Date(report.createdAt.toDate()).toLocaleString()
          : "N/A"}
      </Text>

      <Text style={styles.label}>Reason:</Text>
      <Text style={styles.value}>{report.reason || "N/A"}</Text>

      {/* Admin Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4caf50" }]}
          onPress={() => handleAction("safe")}
        >
          <Text style={styles.buttonText}>Mark as Safe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#ff9800" }]}
          onPress={() => handleAction("warn")}
        >
          <Text style={styles.buttonText}>Warn User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#f44336" }]}
          onPress={() => handleAction("delete")}
        >
          <Text style={styles.buttonText}>Delete Post</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: {
    fontSize: scale(18),
    fontWeight: "700",
    marginBottom: scale(20),
    textAlign: "center",
  },
  label: {
    fontSize: scale(14),
    fontWeight: "600",
    marginTop: scale(10),
  },
  value: {
    fontSize: scale(13),
    color: "#333",
    marginBottom: scale(10),
  },
  actions: { marginTop: scale(25), gap: scale(15) },
  button: {
    padding: scale(12),
    borderRadius: scale(8),
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: scale(14), fontWeight: "600" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: scale(14), color: "#999" },
});

export default AdminPostDetailScreen;
