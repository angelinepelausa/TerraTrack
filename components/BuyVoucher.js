import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert,
  ActivityIndicator, Dimensions, ScrollView
} from 'react-native';
import { scale, vScale } from '../utils/scaling';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { purchasesRepository } from '../repositories/purchasesRepository';

const { width } = Dimensions.get('window');

const BuyVoucher = ({ visible, voucher, isPurchased, onClose, onPurchaseSuccess }) => {
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [partnerDetails, setPartnerDetails] = useState(null);

  useEffect(() => {
    if (!voucher) return;
    fetchUserCoins();
    fetchPartnerDetails();
  }, [voucher]);

  const fetchUserCoins = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        console.error("No authenticated user");
        return;
      }
      
      const userId = user.uid;
      const userDoc = await firestore().collection('users').doc(userId).get();
      if (userDoc.exists) {
        setUserCoins(userDoc.data()?.terraCoins || 0);
      }
    } catch (err) {
      console.error("Error fetching user coins:", err);
    }
  };

  const fetchPartnerDetails = async () => {
    if (!voucher?.partnerId) return;
    
    try {
      const partnerDoc = await firestore()
        .collection('partners')
        .doc(voucher.partnerId)
        .get();
      
      if (partnerDoc.exists) {
        setPartnerDetails(partnerDoc.data());
      }
    } catch (err) {
      console.error("Error fetching partner details:", err);
    }
  };

  const handlePurchase = () => {
    if (userCoins < voucher.terraCoinCost) {
      Alert.alert("Insufficient TerraCoins", "You don't have enough TerraCoins to buy this voucher.");
      return;
    }
    setShowConfirmation(true);
  };

  const purchaseVoucher = async () => {
    setLoading(true);
    try {
      const userId = auth().currentUser.uid;

      const userRef = firestore().collection("users").doc(userId);
      const voucherRef = firestore().collection('vouchers').doc(voucher.id);

      await firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const voucherDoc = await transaction.get(voucherRef);

        const currentCoins = userDoc.data()?.terraCoins || 0;
        if (currentCoins < voucher.terraCoinCost) {
          throw new Error("Not enough TerraCoins");
        }

        const currentAvailable = voucherDoc.data()?.availableQuantity || 0;
        if (currentAvailable <= 0) {
          throw new Error("Voucher is no longer available");
        }

        transaction.update(userRef, {
          terraCoins: currentCoins - voucher.terraCoinCost
        });

        transaction.update(voucherRef, {
          availableQuantity: firestore.FieldValue.increment(-1),
          usedCount: firestore.FieldValue.increment(1)
        });
      });

      const voucherPurchaseData = {
        id: voucher.id,
        voucherId: voucher.voucherId,
        partnerId: voucher.partnerId,
        partnerName: voucher.partnerName,
        partnerLogo: voucher.partnerLogo,
        title: voucher.title,
        description: voucher.description,
        voucherCode: voucher.voucherCode,
        terraCoinCost: voucher.terraCoinCost,
        status: 'unclaimed',
        purchaseDate: new Date(),
        claimedDate: null,
        expiryDate: null
      };

      const result = await purchasesRepository.addVoucherPurchase(userId, voucherPurchaseData);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to purchase voucher");
      }

      if (onPurchaseSuccess) onPurchaseSuccess();
      setShowConfirmation(false);
    } catch (err) {
      console.error("Error purchasing voucher:", err);
      Alert.alert("Error", err.message || "Failed to purchase voucher. Try again.");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  if (!voucher) return null;

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.storeWrapper}>
              {voucher.partnerLogo ? (
                <Image source={{ uri: voucher.partnerLogo }} style={styles.storeImage} />
              ) : (
                <View style={styles.storePlaceholder}>
                  <Text style={styles.storeIcon}>🏪</Text>
                </View>
              )}
            </View>

            <Text style={styles.storeName}>{voucher.partnerName}</Text>

            <Text style={styles.voucherTitle}>{voucher.title}</Text>

            <Text style={styles.description}>{voucher.description}</Text>

            {partnerDetails && (
              <View style={styles.storeDetails}>
                <Text style={styles.detailsTitle}>Store Information</Text>
                {partnerDetails.address && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address:</Text>
                    <Text style={styles.detailText}>{partnerDetails.address}</Text>
                  </View>
                )}
                {partnerDetails.storeHours && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Store Hours:</Text>
                    <Text style={styles.detailText}>{partnerDetails.businessHours}</Text>
                  </View>
                )}
                {partnerDetails.contact && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact:</Text>
                    <Text style={styles.detailText}>{partnerDetails.contact}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.codePreview}>
              <Text style={styles.codeLabel}>Voucher Code:</Text>
              <Text style={styles.codeText}>{voucher.voucherCode}</Text>
            </View>

            {!isPurchased && (
              <View style={styles.coinBox}>
                <Image source={require('../assets/images/TerraCoin.png')} style={styles.coinImage} />
                <Text style={styles.coinText}>{voucher.terraCoinCost}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={[
                styles.actionButton, 
                isPurchased ? styles.claimedButton : styles.purchaseButton,
                (!isPurchased && (loading || userCoins < voucher.terraCoinCost)) ? { opacity: 0.5 } : {}
              ]}
              onPress={isPurchased ? onClose : handlePurchase}
              disabled={!isPurchased && (loading || userCoins < voucher.terraCoinCost)}
            >
              <Text style={styles.actionButtonText}>
                {isPurchased 
                  ? "Show to Store to Claim" 
                  : userCoins < voucher.terraCoinCost 
                    ? "Not Enough Terra Coin" 
                    : "Purchase Now"
                }
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {!isPurchased && (
        <Modal visible={showConfirmation} transparent={true} animationType="fade">
          <View style={styles.confirmationOverlay}>
            <View style={styles.confirmationContainer}>
              <View style={styles.confirmationHeader}>
                <Text style={styles.confirmationTitle}>Confirm Purchase</Text>
              </View>

              <ScrollView style={styles.confirmationContent}>

                <View style={styles.storePreview}>
                  {voucher.partnerLogo ? (
                    <Image source={{ uri: voucher.partnerLogo }} style={styles.confirmationStoreImage} />
                  ) : (
                    <View style={[styles.confirmationStoreImage, styles.confirmationStorePlaceholder]}>
                      <Text style={styles.storeIconLarge}>🏪</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.confirmationStoreName}>{voucher.partnerName}</Text>
                <Text style={styles.confirmationVoucherTitle}>{voucher.title}</Text>
                <Text style={styles.confirmationDescription}>{voucher.description}</Text>
                
                {partnerDetails && (
                  <View style={styles.confirmationStoreDetails}>
                    <Text style={styles.confirmationDetailsTitle}>Store Information</Text>
                    {partnerDetails.address && (
                      <View style={styles.confirmationDetailRow}>
                        <Text style={styles.confirmationDetailLabel}>📍 Address:</Text>
                        <Text style={styles.confirmationDetailText}>{partnerDetails.address}</Text>
                      </View>
                    )}
                    {partnerDetails.storeHours && (
                      <View style={styles.confirmationDetailRow}>
                        <Text style={styles.confirmationDetailLabel}>🕒 Store Hours:</Text>
                        <Text style={styles.confirmationDetailText}>{partnerDetails.storeHours}</Text>
                      </View>
                    )}
                  </View>
                )}
                
                <View style={styles.confirmationCode}>
                  <Text style={styles.confirmationCodeLabel}>Voucher Code:</Text>
                  <Text style={styles.confirmationCodeText}>{voucher.voucherCode}</Text>
                </View>
                
                <View style={styles.priceContainer}>
                  <Image source={require('../assets/images/TerraCoin.png')} style={styles.confirmationCoin} />
                  <Text style={styles.confirmationPrice}>{voucher.terraCoinCost}</Text>
                </View>

                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>Your balance: </Text>
                  <View style={styles.balanceAmount}>
                    <Image source={require('../assets/images/TerraCoin.png')} style={styles.smallCoin} />
                    <Text style={styles.balanceText}>{userCoins}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.confirmationButtons}>
                <TouchableOpacity 
                  style={[styles.confirmationButton, styles.cancelButton]}
                  onPress={() => setShowConfirmation(false)}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmationButton, styles.confirmButton]}
                  onPress={purchaseVoucher}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingVertical: vScale(30),
    paddingHorizontal: scale(25),
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  storeWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 70,
    padding: 5,
    marginBottom: vScale(15),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  storeImage: {
    width: scale(130),
    height: scale(130),
    borderRadius: 65,
    resizeMode: 'cover',
  },
  storePlaceholder: {
    width: scale(130),
    height: scale(130),
    borderRadius: 65,
    backgroundColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeIcon: {
    fontSize: 40,
  },
  storeName: {
    fontSize: scale(18),
    fontWeight: '700',
    marginBottom: vScale(5),
    color: '#709775',
    textAlign: 'center',
  },
  voucherTitle: {
    fontSize: scale(20),
    fontWeight: '700',
    marginBottom: vScale(10),
    color: '#131313',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    fontSize: scale(14),
    color: '#444',
    marginBottom: vScale(15),
    lineHeight: 20,
  },
  storeDetails: {
    backgroundColor: '#FFF',
    padding: scale(15),
    borderRadius: 10,
    marginBottom: vScale(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
  },
  detailsTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#131313',
    marginBottom: 10,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: scale(12),
    fontWeight: '600',
    color: '#709775',
    width: 100,
  },
  detailText: {
    fontSize: scale(12),
    color: '#444',
    flex: 1,
    lineHeight: 16,
  },
  codePreview: {
    backgroundColor: '#FFF',
    padding: scale(10),
    borderRadius: 10,
    marginBottom: vScale(15),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
  },
  codeLabel: {
    fontSize: scale(12),
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  codeText: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#131313',
    textAlign: 'center',
    letterSpacing: 1,
  },
  coinBox: {
    width: scale(90),
    height: vScale(36),
    backgroundColor: '#FFF',
    borderRadius: scale(30),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vScale(25),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  coinImage: {
    width: scale(22),
    height: scale(22),
    marginRight: scale(6),
    resizeMode: 'contain',
  },
  coinText: {
    color: '#131313',
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  actionButton: {
    paddingVertical: vScale(12),
    paddingHorizontal: scale(30),
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    width: '100%',
    alignItems: 'center',
  },
  purchaseButton: {
    backgroundColor: '#415D43',
  },
  claimedButton: {
    backgroundColor: '#709775',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: scale(16),
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#131313',
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmationHeader: {
    backgroundColor: '#415D43',
    padding: 20,
    alignItems: 'center',
  },
  confirmationTitle: {
    color: '#FFFFFF',
    fontSize: scale(20),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confirmationContent: {
    padding: 25,
  },
  storePreview: {
    backgroundColor: '#F8F9F9',
    borderRadius: 60,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'center',
  },
  confirmationStoreImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'cover',
  },
  confirmationStorePlaceholder: {
    backgroundColor: '#DDDDDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeIconLarge: {
    fontSize: 30,
  },
  confirmationStoreName: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#709775',
    marginBottom: 5,
    textAlign: 'center',
  },
  confirmationVoucherTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationDescription: {
    fontSize: scale(14),
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  confirmationStoreDetails: {
    backgroundColor: '#ECF0F1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  confirmationDetailsTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationDetailRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  confirmationDetailLabel: {
    fontSize: scale(12),
    fontWeight: '600',
    color: '#709775',
    width: 100,
  },
  confirmationDetailText: {
    fontSize: scale(12),
    color: '#2C3E50',
    flex: 1,
    lineHeight: 16,
  },
  confirmationCode: {
    backgroundColor: '#ECF0F1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  confirmationCodeLabel: {
    fontSize: scale(12),
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 5,
  },
  confirmationCodeText: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    letterSpacing: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15,
    alignSelf: 'center',
  },
  confirmationCoin: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  confirmationPrice: {
    fontSize: scale(18),
    fontWeight: '700',
    color: '#2C3E50',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: scale(14),
    color: '#7F8C8D',
  },
  balanceAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallCoin: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  balanceText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#2C3E50',
  },
  confirmationButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  confirmationButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#ECF0F1',
  },
  confirmButton: {
    backgroundColor: '#415D43',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: '600',
    fontSize: scale(16),
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: scale(16),
  },
});

export default BuyVoucher;