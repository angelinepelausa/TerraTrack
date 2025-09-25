import { reportRepository } from "../repositories/reportRepository"; 
import firestore from "@react-native-firebase/firestore"; 

export const reportService = { 
  submitReport: async (itemId, itemType, userId, category, subType, parentCommentId = null) => { 
    try { 
      // Submit report - this already handles user_reports hiding and totalReports increment 
      await reportRepository.submitReport(
        itemId, 
        itemType, 
        userId, 
        category, 
        subType, 
        parentCommentId 
      ); 
      // The item is now hidden for the current user via user_reports collection 
      // So it will disappear immediately in the UI 
      return true; 
    } catch (error) { 
      throw error; 
    } 
  }, 
  checkIfUserReported: async (itemId, userId) => { 
    return await reportRepository.checkIfUserReported(itemId, userId); 
  }, 
};