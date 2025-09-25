import { moderationRepository } from "../repositories/moderationRepository";

export const moderationService = {
  markAsSafe: async (itemId, userId, adminId) => {
    await moderationRepository.updatePostStatus(itemId, {
      reviewed: true,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      actionTaken: "safe",
      hidden: false,
      totalReports: 0
    });
  },

  warnUser: async (itemId, userId, adminId, currentWarnings) => {
    let actionTaken;
    let status = "active";

    if (currentWarnings === 1) {
      actionTaken = "warned";
    } else if (currentWarnings === 2) {
      actionTaken = "suspended_1d";
      status = "suspended_1d";
    } else if (currentWarnings === 3) {
      actionTaken = "suspended_7d";
      status = "suspended_7d";
    } else if (currentWarnings >= 4) {
      actionTaken = "banned";
      status = "banned";
    }

    await moderationRepository.updateUserWarnings(userId, currentWarnings, status);

    await moderationRepository.updatePostStatus(itemId, {
      reviewed: true,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      actionTaken,
      hidden: true
    });
  }
};
