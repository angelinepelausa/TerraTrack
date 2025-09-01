import { taskVerificationRepository } from '../repositories/taskVerificationRepository';

export const taskVerificationService = {
  // Get all task verification data for user
  getUserTaskVerificationData: async (userId) => {
    const today = new Date().toISOString().split("T")[0];

    try {
      const [submittedResult, assignedResult] = await Promise.all([
        taskVerificationRepository.getUserSubmittedTasks(userId, today),
        taskVerificationRepository.getAssignedVerificationTasks(userId, today)
      ]);

      return {
        success: submittedResult.success && assignedResult.success,
        submittedTasks: submittedResult.tasks,
        assignedTasks: assignedResult.tasks,
        error: submittedResult.error || assignedResult.error
      };
    } catch (error) {
      console.error("Error in task verification service:", error);
      return {
        success: false,
        error: error.message,
        submittedTasks: [],
        assignedTasks: []
      };
    }
  },

  // Process verification result
  processVerification: async (verifierUid, ownerUid, taskId, result, notes = '') => {
    const today = new Date().toISOString().split("T")[0];

    try {
      const submissionResult = await taskVerificationRepository.submitVerificationResult(
        verifierUid,
        ownerUid,
        taskId,
        today,
        result,
        notes
      );

      return submissionResult;
    } catch (error) {
      console.error("Error processing verification:", error);
      return { success: false, error: error.message };
    }
  },

  // Validate task verification (business logic)
  validateVerification: (task, result, notes) => {
    const errors = [];

    if (!task || !task.photoUrl) {
      errors.push("Invalid task data");
    }

    if (!['approved', 'rejected'].includes(result)) {
      errors.push("Invalid verification result");
    }

    if (result === 'rejected' && (!notes || notes.trim().length < 5)) {
      errors.push("Rejection requires explanation (min 5 characters)");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
