import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert,
  ActivityIndicator, Dimensions, Animated
} from 'react-native';
import { scale, vScale } from '../utils/scaling';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

const BuyAvatar = ({ visible, avatar, onClose, onPurchaseSuccess }) => {
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!avatar) return;
    fetchUserCoins();
  }, [avatar]);

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

  const handlePurchase = () => {
    if (userCoins < avatar.terracoin) {
      Alert.alert("Insufficient TerraCoins", "You don't have enough TerraCoins to buy this avatar.");
      return;
    }
    setShowConfirmation(true);
  };

  const purchaseAvatar = async () => {
    setLoading(true);
    try {
      const userId = auth().currentUser.uid;

      // Run transaction to deduct TerraCoins and add avatar to purchases
      const userPurchasesRef = firestore()
        .collection("users")
        .doc(userId)
        .collection("purchases")
        .doc("avatars");
      const userRef = firestore().collection("users").doc(userId);

      await firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const purchasesDoc = await transaction.get(userPurchasesRef);

        const currentCoins = userDoc.data()?.terraCoins || 0;
        if (currentCoins < avatar.terracoin) {
          throw new Error("Not enough TerraCoins");
        }

        // Deduct coins
        transaction.update(userRef, {
          terraCoins: currentCoins - avatar.terracoin
        });

        // Add avatar to purchases
        const list = purchasesDoc.exists ? purchasesDoc.data()?.list || [] : [];
        if (!list.includes(avatar.id)) list.push(avatar.id);
        transaction.set(userPurchasesRef, { list }, { merge: true });
      });

      if (onPurchaseSuccess) onPurchaseSuccess();
      setShowConfirmation(false);
      Alert.alert("Success", `You purchased "${avatar.name}"!`);
    } catch (err) {
      console.error("Error purchasing avatar:", err);
      Alert.alert("Error", err.message || "Failed to purchase avatar. Try again.");
    } finally {
      setLoading(false);
      onClose();
    }
  };

  if (!avatar) return null;

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>

            {/* Close X */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            {/* Avatar Image */}
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatar.imageurl }} style={styles.avatarImage} />
            </View>

            {/* Avatar Name */}
            <Text style={styles.avatarName}>{avatar.name}</Text>

            {/* Description */}
            <Text style={styles.description}>{avatar.description}</Text>

            {/* Price */}
            <View style={styles.coinBox}>
              <Image source={require('../assets/images/TerraCoin.png')} style={styles.coinImage} />
              <Text style={styles.coinText}>{avatar.terracoin}</Text>
            </View>

            {/* Purchase Button */}
            <TouchableOpacity 
              style={[
                styles.purchaseButton, 
                loading || userCoins < avatar.terracoin ? { opacity: 0.5 } : {}
              ]}
              onPress={handlePurchase}
              disabled={loading || userCoins < avatar.terracoin}
            >
              <Text style={styles.purchaseText}>
                {userCoins < avatar.terracoin ? "Not Enough Terra Coin" : "Purchase Now"}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* Premium Confirmation Modal */}
      <Modal visible={showConfirmation} transparent={true} animationType="fade">
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationContainer}>
            <View style={styles.confirmationHeader}>
              <Text style={styles.confirmationTitle}>Confirm Purchase</Text>
            </View>

            <View style={styles.confirmationContent}>
              <View style={styles.avatarPreview}>
                <Image source={{ uri: avatar.imageurl }} style={styles.confirmationAvatar} />
              </View>
              
              <Text style={styles.confirmationName}>{avatar.name}</Text>
              <Text style={styles.confirmationDescription}>{avatar.description}</Text>
              
              <View style={styles.priceContainer}>
                <Image source={require('../assets/images/TerraCoin.png')} style={styles.confirmationCoin} />
                <Text style={styles.confirmationPrice}>{avatar.terracoin}</Text>
              </View>

              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Your balance: </Text>
                <View style={styles.balanceAmount}>
                  <Image source={require('../assets/images/TerraCoin.png')} style={styles.smallCoin} />
                  <Text style={styles.balanceText}>{userCoins}</Text>
                </View>
              </View>
            </View>

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
                onPress={purchaseAvatar}
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
    </>
  );
};

const styles = StyleSheet.create({
  // Original styles remain the same
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
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
  },
  avatarWrapper: {
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
  avatarImage: {
    width: scale(130),
    height: scale(130),
    borderRadius: 65,
  },
  avatarName: {
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
    marginBottom: vScale(20),
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
  purchaseButton: {
    backgroundColor: '#415D43',
    paddingVertical: vScale(12),
    paddingHorizontal: scale(30),
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  purchaseText: {
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
    alignItems: 'center',
  },
  avatarPreview: {
    backgroundColor: '#F8F9F9',
    borderRadius: 60,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmationAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  confirmationName: {
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
    marginBottom: 20,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15,
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

export default BuyAvatar;