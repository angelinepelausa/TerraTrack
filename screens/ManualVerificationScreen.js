import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { scale, vScale } from '../utils/scaling';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ManualVerificationScreen = () => {
  const [manualCode, setManualCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleManualVerify = async () => {
    if (!manualCode.trim()) return;

    setVerifying(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      // 1. Find the voucher purchase with this code
      const voucherQuery = await firestore()
        .collection('voucher_purchases')
        .where('voucherCode', '==', manualCode.trim().toUpperCase())
        .where('status', '==', 'unclaimed')
        .get();

      if (voucherQuery.empty) {
        Alert.alert('Not Found', 'Voucher not found or already claimed');
        return;
      }

      const voucherDoc = voucherQuery.docs[0];
      const voucherData = voucherDoc.data();

      // 2. Check if this partner owns this voucher
      if (voucherData.partnerId !== user.uid) {
        Alert.alert('Invalid', 'This voucher is not for your business');
        return;
      }

      // 3. Update the voucher status to claimed
      await firestore()
        .collection('voucher_purchases')
        .doc(voucherDoc.id)
        .update({
          status: 'claimed',
          partnerVerified: true,
          verificationDate: firestore.FieldValue.serverTimestamp(),
          verifiedBy: user.uid,
          claimedDate: new Date(),
        });

      // 4. Also update the user's purchase record
      const userPurchaseRef = firestore()
        .collection('users')
        .doc(voucherData.userId)
        .collection('purchases')
        .doc('vouchers');

      // Get current user purchases and update the specific voucher
      const userPurchaseDoc = await userPurchaseRef.get();
      if (userPurchaseDoc.exists) {
        const purchases = userPurchaseDoc.data().list || [];
        const updatedPurchases = purchases.map(purchase => 
          purchase.voucherCode === manualCode.trim().toUpperCase() 
            ? { ...purchase, status: 'claimed', claimedDate: new Date() }
            : purchase
        );
        
        await userPurchaseRef.update({
          list: updatedPurchases
        });
      }

      Alert.alert('Success', `Voucher "${voucherData.title}" verified successfully!`);
      setManualCode('');

    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify voucher. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voucher Verification</Text>
        <Text style={styles.subtitle}>Enter voucher code manually for verification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.verificationCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={scale(80)} color="#709775" />
          </View>
          
          <Text style={styles.cardTitle}>Verify Voucher</Text>
          <Text style={styles.cardDescription}>
            Enter the voucher code provided by the customer to verify and mark it as claimed.
          </Text>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Voucher Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g., ABC123XYZ"
              placeholderTextColor="#666"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              maxLength={12}
              autoFocus={true}
            />
          </View>

          <TouchableOpacity 
            style={[styles.verifyButton, (!manualCode.trim() || verifying) && styles.verifyButtonDisabled]}
            onPress={handleManualVerify}
            disabled={!manualCode.trim() || verifying}
          >
            <Text style={styles.verifyButtonText}>
              {verifying ? 'Verifying...' : 'Verify & Claim'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    paddingTop: vScale(50),
  },
  header: {
    padding: scale(20),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    fontSize: scale(24),
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    marginBottom: vScale(5),
  },
  subtitle: {
    fontSize: scale(14),
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: scale(20),
    justifyContent: 'center',
  },
  verificationCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: scale(20),
    padding: scale(25),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: scale(400),
    justifyContent: 'center',
  },
  iconContainer: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vScale(20),
  },
  cardTitle: {
    fontSize: scale(20),
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    marginBottom: vScale(10),
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: scale(14),
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
    marginBottom: vScale(25),
    lineHeight: scale(20),
  },
  inputSection: {
    width: '100%',
    marginBottom: vScale(25),
  },
  inputLabel: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(16),
    marginBottom: vScale(10),
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: '#2a2a2a',
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(18),
    padding: scale(15),
    borderRadius: scale(15),
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#415D43',
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: '#709775',
    paddingHorizontal: scale(30),
    paddingVertical: scale(15),
    borderRadius: scale(15),
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: '#415D43',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(16),
    marginLeft: scale(10),
  },
});

export default ManualVerificationScreen;