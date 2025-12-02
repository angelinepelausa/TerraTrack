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
import firestore from "@react-native-firebase/firestore";

const AdminPostDetailScreen = ({ route, navigation }) => {
  const { reportId, category = "posts" } = route.params;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedReporters, setExpandedReporters] = useState({});
  const [username, setUsername] = useState("Loading...");

  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true; // Add this flag

    const fetchUserDetails = async (userId) => {
      if (!userId || !isMounted) return; // Check if component is mounted
      
      try {
        const userDoc = await firestore().collection("users").doc(userId).get();
        if (isMounted && userDoc.exists) {
          const userData = userDoc.data();
          setUsername(userData.username || "Unknown User");
        } else if (isMounted) {
          setUsername("Unknown User");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        if (isMounted) setUsername("Unknown User");
      }
    };

    const setupRealTimeListener = async () => {
      if (!isMounted) return; // Check if component is mounted
      
      try {
        unsubscribe = await moderationRepository.getReportRealTimeListener(
          reportId, 
          (updatedReport) => {
            if (isMounted && updatedReport) { // Check if mounted
              setReport(updatedReport);
              if (updatedReport.originalData?.userId) {
                fetchUserDetails(updatedReport.originalData.userId);
              }
            }
          },
          (error) => {
            if (isMounted) { // Only log if component is mounted
              console.error("Real-time listener error:", error);
            }
          }
        );
      } catch (error) {
        if (isMounted) { // Only log if component is mounted
          console.error("Error setting up real-time listener:", error);
        }
      }
    };

    const fetchReportDetails = async () => {
      if (!isMounted) return; // Check if component is mounted
      
      try {
        setLoading(true);
        const posts = await moderationRepository.getForReviewPosts();
        const foundReport = posts.find(post => post.id === reportId);
        
        if (isMounted && foundReport) {
          setReport(foundReport);
          
          // Fetch username from userId
          if (foundReport.originalData?.userId) {
            await fetchUserDetails(foundReport.originalData.userId);
          } else if (foundReport.username) {
            setUsername(foundReport.username);
          }
          
          await setupRealTimeListener();
        } else if (isMounted) {
          console.error("Report not found");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching report details:", error);
          Alert.alert("Error", "Failed to load report details");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReportDetails();

    return () => {
      isMounted = false; // Set to false when component unmounts
      
      if (unsubscribe) {
        unsubscribe(); // Unsubscribe from real-time listener
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
          Alert.alert("Success", "Content has been reviewed and approved.");
          break;

        case "suspend":
          Alert.alert(
            "Confirm Suspension",
            "Are you sure you want to suspend this user? This will delete the content and suspend the user account.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Suspend", 
                style: "destructive",
                onPress: async () => {
                  await moderationService.suspendUser(report.id, report);
                  Alert.alert("User Suspended", "Content deleted and user has been suspended.");
                }
              }
            ]
          );
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
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'reviewed': return '#4CAF50';
      case 'pending': return '#FF9800';
      default: return '#888';
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
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isReviewed = report.status?.toLowerCase() === 'reviewed';

  return (
    <View style={styles.container}>
      {/* HeaderRow with proper padding */}
      <View style={styles.headerRowContainer}>
        <HeaderRow 
          title="Report Details" 
          onBackPress={() => navigation.goBack()}
        />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card - Simplified Info */}
        <View style={styles.headerCard}>
          <View style={styles.userStatusRow}>
            <View style={styles.userInfo}>
              <Text style={styles.userLabel}>USER</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {username}
              </Text>
            </View>
            
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(report.status) }]} />
              <Text style={styles.statusText}>
                {report.status?.toUpperCase() || "UNKNOWN"}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Content Details</Text>
          </View>
          
          <View style={styles.contentCard}>
            <Text style={styles.contentLabel}>FULL CONTENT</Text>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>
                {report.originalData?.text || report.text || "No text content available"}
              </Text>
            </View>
            
            <View style={styles.metadataGrid}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>USER ID</Text>
                <Text style={styles.metadataValue} numberOfLines={1}>
                  {report.originalData?.userId || "N/A"}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>ITEM ID</Text>
                <Text style={styles.metadataValue} numberOfLines={1}>
                  {report.itemId || "N/A"}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>POSTED AT</Text>
                <Text style={styles.metadataValue}>
                  {formatTimestamp(report.originalData?.timestamp)}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>REPORTED AT</Text>
                <Text style={styles.metadataValue}>
                  {formatTimestamp(report.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reports Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reports ({report.reporters?.length || 0})</Text>
          </View>
          
          {report.reporters?.map((reporter, index) => (
            <TouchableOpacity
              key={reporter.reportId || index}
              style={styles.reporterCard}
              onPress={() => toggleReporter(index)}
              activeOpacity={0.7}
            >
              <View style={styles.reporterHeader}>
                <View style={styles.reporterIndex}>
                  <Text style={styles.reporterIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.reporterInfo}>
                  <Text style={styles.reporterCategory}>{reporter.category || "Uncategorized"}</Text>
                  <Text style={styles.reporterSubtype}>{reporter.subType || "No subtype specified"}</Text>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedReporters[index] ? "−" : "+"}
                </Text>
              </View>
              
              {expandedReporters[index] && (
                <View style={styles.reporterDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabelSmall}>REPORTING USER ID</Text>
                    <Text style={styles.detailValueSmall}>{reporter.userId || "N/A"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabelSmall}>REPORT ID</Text>
                    <Text style={styles.detailValueSmall}>{reporter.reportId || "N/A"}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabelSmall}>REPORTED AT</Text>
                    <Text style={styles.detailValueSmall}>{formatTimestamp(reporter.timestamp)}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
          
          {(!report.reporters || report.reporters.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No reports found</Text>
            </View>
          )}
        </View>

        {/* Only show Admin Actions if NOT reviewed */}
        {!isReviewed && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Admin Actions</Text>
            </View>
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.safeButton]}
                onPress={() => handleAction("safe")}
                disabled={actionLoading}
              >
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Mark as Safe</Text>
                  <Text style={styles.actionDescription}>
                    Approve this content and clear all reports
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.suspendButton]}
                onPress={() => handleAction("suspend")}
                disabled={actionLoading}
              >
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Suspend User</Text>
                  <Text style={styles.actionDescription}>
                    Remove content and suspend user account
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Loading Overlay */}
        {actionLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#709775" />
            <Text style={styles.loadingOverlayText}>Processing...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#131313" 
  },
  // Header Row Container with proper padding
  headerRowContainer: {
    paddingHorizontal: scale(16),
    marginTop: scale(20),
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: { 
    padding: scale(16),
    paddingBottom: scale(32)
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
    paddingVertical: scale(12),
    borderRadius: scale(8)
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: scale(14)
  },
  // Header Card
  headerCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: scale(24),
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  userStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userLabel: {
    fontSize: scale(10),
    color: "#888",
    fontWeight: "600",
    marginBottom: scale(6),
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: scale(18),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(20),
  },
  statusDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    marginRight: scale(8),
  },
  statusText: {
    fontSize: scale(13),
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  // Sections
  section: {
    marginBottom: scale(24),
  },
  sectionHeader: {
    marginBottom: scale(16),
    paddingLeft: scale(4),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Content Section
  contentCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: scale(12),
    padding: scale(20),
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  contentLabel: {
    fontSize: scale(10),
    color: "#888",
    fontWeight: "600",
    marginBottom: scale(12),
    letterSpacing: 0.8,
  },
  contentBox: {
    backgroundColor: "#252525",
    borderRadius: scale(8),
    padding: scale(16),
    marginBottom: scale(20),
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  contentText: {
    fontSize: scale(14),
    color: "#FFFFFF",
    lineHeight: scale(22),
  },
  metadataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(16),
  },
  metadataItem: {
    flex: 1,
    minWidth: scale(150),
  },
  metadataLabel: {
    fontSize: scale(10),
    color: "#888",
    fontWeight: "600",
    marginBottom: scale(6),
    letterSpacing: 0.8,
  },
  metadataValue: {
    fontSize: scale(13),
    color: "#FFFFFF",
    fontWeight: "500",
  },
  // Reporter Cards
  reporterCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: scale(12),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: "#2A2A2A",
    overflow: "hidden",
  },
  reporterHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(16),
  },
  reporterIndex: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#709775",
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(16),
  },
  reporterIndexText: {
    fontSize: scale(14),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  reporterInfo: {
    flex: 1,
  },
  reporterCategory: {
    fontSize: scale(15),
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: scale(4),
  },
  reporterSubtype: {
    fontSize: scale(12),
    color: "#888",
    lineHeight: scale(16),
  },
  expandIcon: {
    fontSize: scale(18),
    color: "#709775",
    fontWeight: "bold",
    marginLeft: scale(8),
  },
  reporterDetails: {
    padding: scale(16),
    paddingTop: 0,
    backgroundColor: "#252525",
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  detailLabelSmall: {
    fontSize: scale(11),
    color: "#888",
    fontWeight: "500",
  },
  detailValueSmall: {
    fontSize: scale(12),
    color: "#FFFFFF",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    padding: scale(40),
    backgroundColor: "#1E1E1E",
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  emptyStateText: {
    fontSize: scale(14),
    color: "#888",
  },
  // Actions (for pending items)
  actionsContainer: {
    gap: scale(16),
  },
  actionButton: {
    backgroundColor: "#1E1E1E",
    padding: scale(20),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: scale(16),
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: scale(6),
  },
  actionDescription: {
    fontSize: scale(13),
    color: "#888",
    lineHeight: scale(18),
  },
  safeButton: {
    borderColor: "#4CAF50",
  },
  suspendButton: {
    borderColor: "#FF6B6B",
  },
  // Loading Overlay
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(19, 19, 19, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlayText: {
    color: "#888",
    marginTop: scale(10),
    fontSize: scale(14),
  },
});

export default AdminPostDetailScreen;