// services/moderationService.js
import { moderationRepository } from "../repositories/moderationRepository";
import auth from '@react-native-firebase/auth'; // FIXED: Remove curly braces
import firestore from '@react-native-firebase/firestore';

export const moderationService = {
  markAsSafe: async (itemId, reportData, adminId = null) => {
    const currentAdminId = adminId || auth().currentUser?.uid; // FIXED: Now auth() will work
    
    if (!currentAdminId) {
      throw new Error("Admin user not authenticated");
    }

    // Update forReview status
    await moderationRepository.updatePostStatus(itemId, {
      status: "reviewed",
      actionTaken: "marked_safe",
      reviewedBy: currentAdminId,
      reviewedAt: firestore.FieldValue.serverTimestamp()
    });

    // Update community_progress
    await moderationRepository.updateCommunityProgress(
      reportData.quarter,
      reportData.itemId,
      {
        totalReports: 0,
        hidden: false
      }
    );

    // Log the action for accountability
    await moderationRepository.logModerationAction({
      itemId: reportData.itemId,
      reportId: itemId,
      adminId: currentAdminId,
      action: "marked_safe",
      targetUserId: reportData.originalData?.userId,
      itemType: reportData.itemType,
      quarter: reportData.quarter,
      details: {
        previousStatus: reportData.status,
        reportsCount: reportData.reportsCount,
        reporters: reportData.reporters?.length || 0
      }
    });
  },

  suspendUser: async (itemId, reportData, adminId = null) => {
    const currentAdminId = adminId || auth().currentUser?.uid; // FIXED: Now auth() will work
    
    if (!currentAdminId) {
      throw new Error("Admin user not authenticated");
    }

    const targetUserId = reportData.originalData?.userId;
    if (!targetUserId) {
      throw new Error("Target user ID not found");
    }

    // Get current user data to determine suspend count
    const userData = await moderationRepository.getUserData(targetUserId);
    const currentSuspendCount = userData.suspendedCount || 0;
    const newSuspendCount = currentSuspendCount + 1;

    // Determine suspension duration based on suspend count
    let suspensionDurationHours = 0;
    let userStatus = "active";

    switch (newSuspendCount) {
      case 1:
        userStatus = "active"; // Warning only
        break;
      case 2:
        suspensionDurationHours = 24; // 1 day
        userStatus = "suspended";
        break;
      case 3:
        suspensionDurationHours = 168; // 7 days
        userStatus = "suspended";
        break;
      case 4:
        suspensionDurationHours = 720; // 30 days
        userStatus = "suspended";
        break;
      case 5:
        userStatus = "banned"; // Permanent ban
        break;
      default:
        if (newSuspendCount > 5) {
          userStatus = "banned";
        }
        break;
    }

    // Calculate suspension end time
    const suspensionStart = firestore.FieldValue.serverTimestamp();
    let suspensionEnd = null;
    
    if (userStatus === "suspended") {
      const now = new Date();
      const endTime = new Date(now.getTime() + (suspensionDurationHours * 60 * 60 * 1000));
      suspensionEnd = firestore.Timestamp.fromDate(endTime);
    }

    // Update forReview status
    await moderationRepository.updatePostStatus(itemId, {
      status: "reviewed",
      actionTaken: "user_suspended",
      reviewedBy: currentAdminId,
      reviewedAt: firestore.FieldValue.serverTimestamp()
    });

    // Delete from community_comments
    await moderationRepository.deleteFromCommunityProgress(
      reportData.quarter,
      reportData.itemId
    );

    // Update user's suspension data
    await moderationRepository.updateUserSuspensionData(
      targetUserId,
      newSuspendCount,
      userStatus,
      suspensionStart,
      suspensionEnd,
      reportData.reporters?.[0]?.category || "Violation" // Use first reporter's category as reason
    );

    // Log the action for accountability
    await moderationRepository.logModerationAction({
      itemId: reportData.itemId,
      reportId: itemId,
      adminId: currentAdminId,
      action: "user_suspended",
      targetUserId: targetUserId,
      itemType: reportData.itemType,
      quarter: reportData.quarter,
      details: {
        previousStatus: reportData.status,
        contentDeleted: true,
        userSuspended: true,
        suspendCount: newSuspendCount,
        suspensionDurationHours: suspensionDurationHours,
        userStatus: userStatus,
        reason: reportData.reporters?.[0]?.category || "Violation"
      }
    });
  },

  // Get moderation history for an item
  getModerationHistory: async (itemId) => {
    return await moderationRepository.getModerationActions(itemId);
  }
};