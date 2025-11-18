import firestore from '@react-native-firebase/firestore';

export const voucherRepository = {
  // Get all partners for dropdown
  async getAllPartners() {
    try {
      const snapshot = await firestore()
        .collection('partners')
        .where('status', '==', 'active')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching partners:', error);
      throw error;
    }
  },

  // Create new voucher
  async createVoucher(voucherData) {
    try {
      const voucherRef = firestore().collection('vouchers').doc();
      
      const voucher = {
        voucherId: voucherRef.id,
        ...voucherData,
        availableQuantity: voucherData.totalQuantity,
        usedCount: 0,
        status: 'active',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      await voucherRef.set(voucher);
      return { success: true, voucherId: voucherRef.id };
    } catch (error) {
      console.error('Error creating voucher:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate unique voucher code
  generateVoucherCode(partnerName) {
    const partnerInitials = partnerName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 3);
    
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${partnerInitials}-${randomChars}`;
  },

  // Get all vouchers
  async getAllVouchers() {
    try {
      const snapshot = await firestore()
        .collection('vouchers')
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      throw error;
    }
  },

  // Update voucher
  async updateVoucher(voucherId, voucherData) {
    try {
      await firestore()
        .collection('vouchers')
        .doc(voucherId)
        .update({
          ...voucherData,
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating voucher:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete voucher
  async deleteVoucher(voucherId) {
    try {
      await firestore()
        .collection('vouchers')
        .doc(voucherId)
        .delete();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting voucher:', error);
      return { success: false, error: error.message };
    }
  },

  // Get voucher statistics for partner (SIMPLIFIED - no complex queries)
  async getVoucherStats(partnerId, timeFrame = 'week') {
    try {
      // Get ALL voucher purchases for this partner and filter in memory
      const allPurchasesSnapshot = await firestore()
        .collection('voucher_purchases')
        .where('partnerId', '==', partnerId)
        .get();

      const allPurchases = allPurchasesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate date ranges
      const now = new Date();
      let startDate;
      
      switch (timeFrame) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Filter in memory to avoid composite index issues
      const redeemedInTimeFrame = allPurchases.filter(purchase => 
        purchase.status === 'claimed' && 
        purchase.verificationDate && 
        purchase.verificationDate.toDate() >= startDate
      );

      const totalRedeemed = redeemedInTimeFrame.length;

      // Get claimed today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const claimedToday = allPurchases.filter(purchase => 
        purchase.status === 'claimed' && 
        purchase.verificationDate && 
        purchase.verificationDate.toDate() >= todayStart
      ).length;

      // Get unclaimed vouchers
      const unclaimedVouchers = allPurchases.filter(purchase => 
        purchase.status === 'unclaimed'
      ).length;

      // Get available vouchers (from vouchers collection)
      const allVouchers = await this.getAllVouchers();
      const partnerVouchers = allVouchers.filter(voucher => 
        voucher.partnerId === partnerId && voucher.status === 'active'
      );
      
      let availableVouchers = 0;
      partnerVouchers.forEach(voucher => {
        availableVouchers += voucher.availableQuantity || 0;
      });

      return {
        totalRedeemed,
        claimedToday,
        availableVouchers,
        unclaimedVouchers,
        success: true
      };

    } catch (error) {
      console.error('Error fetching voucher stats:', error);
      return { 
        success: false, 
        error: error.message,
        totalRedeemed: 0,
        claimedToday: 0,
        availableVouchers: 0,
        unclaimedVouchers: 0
      };
    }
  },

  // Get recent voucher purchases for partner (SIMPLIFIED)
  async getRecentVoucherPurchases(partnerId, limit = 10) {
    try {
      const snapshot = await firestore()
        .collection('voucher_purchases')
        .where('partnerId', '==', partnerId)
        .get();
      
      const allPurchases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by purchase date in memory
      return allPurchases
        .sort((a, b) => {
          const dateA = a.purchaseDate ? a.purchaseDate.toDate() : new Date(0);
          const dateB = b.purchaseDate ? b.purchaseDate.toDate() : new Date(0);
          return dateB - dateA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent purchases:', error);
      throw error;
    }
  },

  // Get partner vouchers only
  async getPartnerVouchers(partnerId) {
    try {
      const allVouchers = await this.getAllVouchers();
      return allVouchers.filter(voucher => voucher.partnerId === partnerId);
    } catch (error) {
      console.error('Error fetching partner vouchers:', error);
      throw error;
    }
  },

  // Get claimed vouchers for partner (for detailed view)
  async getClaimedVouchers(partnerId) {
    try {
      const snapshot = await firestore()
        .collection('voucher_purchases')
        .where('partnerId', '==', partnerId)
        .where('status', '==', 'claimed')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching claimed vouchers:', error);
      throw error;
    }
  },

  // Get unclaimed vouchers for partner
  async getUnclaimedVouchers(partnerId) {
    try {
      const snapshot = await firestore()
        .collection('voucher_purchases')
        .where('partnerId', '==', partnerId)
        .where('status', '==', 'unclaimed')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching unclaimed vouchers:', error);
      throw error;
    }
  }
};