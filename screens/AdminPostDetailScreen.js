// screens/AdminPostDetailScreen.js
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
import { moderationRepository } from "../repositories/moderationRepository";
import { moderationService } from "../services/moderationService";
import { scale } from "../utils/scaling";
import HeaderRow from "../components/HeaderRow";

const AdminPostDetailScreen = ({ route, navigation }) => {
  const { reportId, category = "posts" } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedReporters, setExpandedReporters] = useState({});

  useEffect(() => {
    let unsubscribe = null;

    const setupRealTimeListener = async () => {
      try {
        // Set up real-time listener for this specific report
        unsubscribe = await moderationRepository.getReportRealTimeListener(
          reportId, 
          (updatedReport) => {
            if (updatedReport) {
              console.log("Real-time update received:", updatedReport.status);
              setReport(updatedReport);
            }
          },
          (error) => {
            console.error("Real-time listener error:", error);
          }
        );
      } catch (error) {
        console.error("Error setting up real-time listener:", error);
      }
    };

    const fetchReportDetails = async () => {
      try {
        setLoading(true);
        const posts = await moderationRepository.getForReviewPosts();
        const foundReport = posts.find(post => post.id === reportId);
        
        if (foundReport) {
          setReport(foundReport);
          // Set up real-time listener after initial fetch
          await setupRealTimeListener();
        } else {
          console.error("Report not found");
        }
      } catch (error) {
        console.error("Error fetching report details:", error);
        Alert.alert("Error", "Failed to load report details");
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();

    // Cleanup function to unsubscribe from real-time listener
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [reportId]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (!report) return;

      switch (action) {
        case "safe":
          await moderationService.markAsSafe(report.id, report);
          // No need to navigate back immediately since status will update in real-time
          Alert.alert("Marked as Safe", "Content has been reviewed and approved.");
          break;

        case "suspend":
          await moderationService.suspendUser(report.id, report);
          Alert.alert("User Suspended", "Content deleted and user has been suspended.");
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Admin action error:", error);
      Alert.alert("Error", "Failed to perform action");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleReporter = (index) => {
    setExpandedReporters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#709775" />
        <Text style={styles.loadingText}>Loading report details...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Report not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <HeaderRow title="Report Details" onBackPress={() => navigation.goBack()} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <InfoRow label="Item ID" value={report.itemId} />
        <InfoRow label="Item Type" value={report.itemType} />
        <InfoRow label="Status" value={report.status} />
        <InfoRow label="Total Reports" value={report.reportsCount?.toString() || report.reporters?.length?.toString() || "0"} />
        <InfoRow label="Quarter" value={report.quarter} />
        <InfoRow label="Action Taken" value={report.actionTaken || "None"} />
        <InfoRow label="Created At" value={formatTimestamp(report.createdAt)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Original Content</Text>
        <InfoRow label="User ID" value={report.originalData?.userId || "Unknown"} />
        <InfoRow label="Username" value={report.username || "Unknown"} />
        <InfoRow label="Text Content" value={report.originalData?.text || report.text || "No text content"} />
        <InfoRow label="Posted At" value={formatTimestamp(report.originalData?.timestamp || report.timestamp)} />
        <InfoRow label="Parent Comment ID" value={report.originalData?.parentCommentId || "None"} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report ({report.reporters?.length || 0})</Text>
        {report.reporters?.map((reporter, index) => (
          <View key={reporter.reportId || index} style={styles.reporterCard}>
            <TouchableOpacity 
              style={styles.reporterHeader} 
              onPress={() => toggleReporter(index)}
            >
              <Text style={styles.reporterHeaderText}>Report #{index + 1}</Text>
              <Text style={styles.expandIcon}>
                {expandedReporters[index] ? "−" : "+"}
              </Text>
            </TouchableOpacity>
            
            {expandedReporters[index] && (
              <View style={styles.reporterDetails}>
                <InfoRow label="User ID" value={reporter.userId} />
                <InfoRow label="Category" value={reporter.category} />
                <InfoRow label="Subtype" value={reporter.subType} />
                <InfoRow label="Reported At" value={formatTimestamp(reporter.timestamp)} />
                <InfoRow label="Report ID" value={reporter.reportId} />
              </View>
            )}
          </View>
        ))}
        
        {(!report.reporters || report.reporters.length === 0) && (
          <Text style={styles.noDataText}>No reporters found</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin Actions</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.safeButton, actionLoading && styles.disabledButton]}
            onPress={() => handleAction("safe")}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Mark as Safe</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.suspendButton, actionLoading && styles.disabledButton]}
            onPress={() => handleAction("suspend")}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Suspend User</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#131313" 
  },
  contentContainer: { 
    padding: scale(16) 
  },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#131313"
  },
  loadingText: {
    color: "#888",
    marginTop: scale(10),
    fontSize: scale(14)
  },
  emptyText: { 
    fontSize: scale(16), 
    color: "#888",
    marginBottom: scale(20)
  },
  backButton: {
    backgroundColor: "#709775",
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(8)
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: scale(14)
  },
  section: {
    backgroundColor: "#1E1E1E",
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(16)
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: "600",
    color: "#709775",
    marginBottom: scale(12)
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(8),
    paddingVertical: scale(4)
  },
  infoLabel: {
    fontSize: scale(13),
    fontWeight: "500",
    color: "#888",
    flex: 1
  },
  infoValue: {
    fontSize: scale(13),
    fontWeight: "400",
    color: "#FFFFFF",
    flex: 2,
    textAlign: "right"
  },
  reporterCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: scale(8),
    padding: scale(12),
    marginBottom: scale(8)
  },
  reporterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(8)
  },
  reporterHeaderText: {
    fontSize: scale(14),
    fontWeight: "600",
    color: "#709775",
  },
  expandIcon: {
    fontSize: scale(18),
    fontWeight: "bold",
    color: "#709775"
  },
  reporterDetails: {
    marginTop: scale(8),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: "#3A3A3A"
  },
  noDataText: {
    color: "#888",
    fontSize: scale(13),
    fontStyle: "italic",
    textAlign: "center"
  },
  actions: {
    flexDirection: "row",
    gap: scale(12)
  },
  actionButton: {
    flex: 1,
    paddingVertical: scale(12),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
    minHeight: scale(44)
  },
  safeButton: {
    backgroundColor: "#4CAF50"
  },
  suspendButton: {
    backgroundColor: "#FF6B6B"
  },
  disabledButton: {
    opacity: 0.6
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: scale(14),
    fontWeight: "600"
  }
});

export default AdminPostDetailScreen;