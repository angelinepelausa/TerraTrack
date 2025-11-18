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
  },

  getUserVouchers: async (userId) => {
    try {
      const doc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('purchases')
        .doc('vouchers')
        .get();
      
      if (!doc.exists) {
        return { list: [] };
      }
      
      const data = doc.data();
      return { list: data?.list || [] };
    } catch (error) {
      console.error('Error fetching user vouchers:', error);
      return { list: [] };
    }
  },

  addVoucherPurchase: async (userId, voucherData) => {
    try {
      const user = auth().currentUser;
      if (!user || user.uid !== userId) {
        return { success: false, error: "User not authenticated" };
      }
      
      // 1. Add to user's purchases collection
      const userPurchasesRef = firestore()
        .collection("users")
        .doc(userId)
        .collection("purchases")
        .doc("vouchers");

      // 2. Create global voucher purchase record for partners
      const globalPurchaseRef = firestore()
        .collection("voucher_purchases")
        .doc();

      const globalPurchaseData = {
        id: globalPurchaseRef.id,
        userId: userId,
        userName: user.displayName || user.email,
        userEmail: user.email,
        voucherId: voucherData.voucherId,
        partnerId: voucherData.partnerId,
        partnerName: voucherData.partnerName,
        partnerLogo: voucherData.partnerLogo,
        title: voucherData.title,
        description: voucherData.description,
        voucherCode: voucherData.voucherCode,
        terraCoinCost: voucherData.terraCoinCost,
        status: 'unclaimed',
        purchaseDate: firestore.FieldValue.serverTimestamp(),
        claimedDate: null,
        expiryDate: null,
        partnerVerified: false,
        verificationDate: null,
        verifiedBy: null
      };

      // Use batch write for both operations
      const batch = firestore().batch();
      
      // Update user's local purchases
      batch.set(userPurchasesRef, {
        list: firestore.FieldValue.arrayUnion({
          ...voucherData,
          globalPurchaseId: globalPurchaseRef.id,
          purchaseDate: new Date(),
          status: 'unclaimed'
        })
      }, { merge: true });
      
      // Create global record
      batch.set(globalPurchaseRef, globalPurchaseData);
      
      await batch.commit();

      return { success: true, globalPurchaseId: globalPurchaseRef.id };
    } catch (error) {
      console.error("addVoucherPurchase error:", error.code, error.message);
      return { success: false, error: error.message, code: error.code };
    }
  },

  // Get vouchers for partners to see
  getPartnerVouchers: async (partnerId) => {
    try {
      const snapshot = await firestore()
        .collection('voucher_purchases')
        .where('partnerId', '==', partnerId)
        .orderBy('purchaseDate', 'desc')
        .get();
      
      const vouchers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, vouchers };
    } catch (error) {
      console.error('Error fetching partner vouchers:', error);
      return { success: false, error: error.message, vouchers: [] };
    }
  },

  // Partner verifies a voucher
  verifyVoucher: async (purchaseId, partnerId, verifiedBy) => {
    try {
      const voucherRef = firestore()
        .collection('voucher_purchases')
        .doc(purchaseId);

      await voucherRef.update({
        status: 'claimed',
        partnerVerified: true,
        verificationDate: firestore.FieldValue.serverTimestamp(),
        verifiedBy: verifiedBy
      });

      return { success: true };
    } catch (error) {
      console.error('Error verifying voucher:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single voucher purchase by ID
  getVoucherPurchase: async (purchaseId) => {
    try {
      const doc = await firestore()
        .collection('voucher_purchases')
        .doc(purchaseId)
        .get();
      
      if (!doc.exists) {
        return { success: false, error: "Voucher not found" };
      }
      
      return { success: true, voucher: { id: doc.id, ...doc.data() } };
    } catch (error) {
      console.error('Error fetching voucher purchase:', error);
      return { success: false, error: error.message };
    }
  }
};