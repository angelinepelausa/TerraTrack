import { reportRepository } from "../repositories/reportRepository"; 
import firestore from "@react-native-firebase/firestore"; 

export const reportService = { 
  submitReport: async (itemId, itemType, userId, category, subType, parentCommentId = null) => { 
    try { 
      await reportRepository.submitReport(
        itemId, 
        itemType, 
        userId, 
        category, 
        subType, 
        parentCommentId 
      ); 

      return true; 
    } catch (error) { 
      throw error; 
    } 
  }, 
  checkIfUserReported: async (itemId, userId) => { 
    return await reportRepository.checkIfUserReported(itemId, userId); 
  }, 
};