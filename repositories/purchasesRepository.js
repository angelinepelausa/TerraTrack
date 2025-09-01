import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

export const purchasesRepository = {
  addAvatarPurchase: async (userId, avatarId) => {
    try {
      const user = auth().currentUser;
      if (!user || user.uid !== userId) {
        return { success: false, error: "User not authenticated" };
      }
      
      const ref = firestore()
        .collection("users")
        .doc(userId)
        .collection("purchases")
        .doc("avatars");

      await firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(ref);
        const list = doc.exists ? doc.data()?.list || [] : [];
        if (!list.includes(avatarId)) {
          transaction.set(ref, { list: [...list, avatarId] }, { merge: true });
        }
      });

      return { success: true };
    } catch (error) {
      console.error("addAvatarPurchase error:", error.code, error.message);
      return { success: false, error: error.message, code: error.code };
    }
  },

  removeAvatarPurchase: async (userId, avatarId) => {
    try {
      const ref = firestore()
        .collection("users")
        .doc(userId)
        .collection("purchases")
        .doc("avatars");

      await firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(ref);
        if (!doc.exists) return;
        const list = doc.data()?.list || [];
        transaction.set(ref, { list: list.filter(id => id !== avatarId) }, { merge: true });
      });

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message };
    }
  },

  getUserPurchases: async (userId) => {
    try {
      const snap = await firestore()
        .collection("users")
        .doc(userId)
        .collection("purchases")
        .doc("avatars")
        .get();

      const list = snap.exists ? snap.data()?.list || [] : [];
      return { success: true, list };
    } catch (error) {
      console.error(error);
      return { success: false, error: error.message, list: [] };
    }
  }
};
