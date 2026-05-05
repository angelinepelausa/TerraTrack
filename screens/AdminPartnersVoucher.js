import React, { useState, useEffect } from "react";
import { 
  View, StyleSheet, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions, Alert, Modal 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { voucherRepository } from "../repositories/voucherRepository";
import HeaderRow from "../components/HeaderRow";
import SearchRow from "../components/SearchRow";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;

const AdminPartnersVoucher = () => {
  const navigation = useNavigation();
  const [vouchers, setVouchers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const voucherData = await voucherRepository.getAllVouchers();
      const vouchersWithLogos = await Promise.all(
        voucherData.map(async (voucher) => {
          try {
            const partnerSnapshot = await voucherRepository.getAllPartners();
            const partner = partnerSnapshot.find(p => p.id === voucher.partnerId);
            return {
              ...voucher,
              partnerLogo: partner?.logoUrl || null
            };
          } catch (error) {
            return voucher;
          }
        })
      );
      
      setVouchers(vouchersWithLogos);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
      Alert.alert("Error", "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVoucher = (voucher) => {
    Alert.alert(
      "Delete Voucher",
      `Are you sure you want to delete "${voucher.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await voucherRepository.deleteVoucher(voucher.id);
              fetchVouchers();
            } catch (err) {
              console.error("Failed to delete voucher:", err);
              Alert.alert("Error", "Failed to delete voucher");
            }
          } 
        },
      ]
    );
  };

  const handleEditVoucher = (voucher) => {
    setModalVisible(false);
    navigation.navigate("AddPartnersVoucher", { 
      voucher: voucher, 
      onSaved: fetchVouchers 
    });
  };

  const showVoucherDetails = (voucher) => {
    setSelectedVoucher(voucher);
    setModalVisible(true);
  };

  const renderVoucherItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemBox}
      onPress={() => showVoucherDetails(item)}
    >
      <View style={styles.logoContainer}>
        {item.partnerLogo ? (
          <Image source={{ uri: item.partnerLogo }} style={styles.storeLogo} />
        ) : (
          <View style={[styles.storeLogo, styles.logoPlaceholder]}>
            <Ionicons name="storefront-outline" size={24} color="#709775" />
          </View>
        )}
      </View>

      <Text style={styles.storeName} numberOfLines={1}>
        {item.partnerName}
      </Text>

      <Text style={styles.voucherTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteVoucher(item)}
      >
        <Ionicons name="trash-outline" size={18} color="#ff4d4d" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filteredVouchers = vouchers.filter((item) =>
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.partnerName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <HeaderRow
        title="Vouchers"
        onBackPress={() => navigation.goBack()}
      />
      
      <SearchRow
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPress={() => navigation.navigate("AddPartnersVoucher", { onSaved: fetchVouchers })}
        placeholder="Search vouchers..."
      />

      {loading ? (
        <ActivityIndicator size="large" color="#709775" style={{ marginTop: 50 }} />
      ) : filteredVouchers.length === 0 ? (
        <Text style={styles.emptyText}>
          {searchQuery ? "No vouchers found" : "No vouchers yet"}
        </Text>
      ) : (
        <FlatList
          data={filteredVouchers}
          keyExtractor={(item) => item.id}
          renderItem={renderVoucherItem}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 16 }}
        />
      )}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedVoucher && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Voucher Details</Text>
                  <TouchableOpacity 
                    onPress={() => setModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#709775" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalStoreInfo}>
                  {selectedVoucher.partnerLogo ? (
                    <Image source={{ uri: selectedVoucher.partnerLogo }} style={styles.modalStoreLogo} />
                  ) : (
                    <View style={[styles.modalStoreLogo, styles.modalLogoPlaceholder]}>
                      <Ionicons name="storefront-outline" size={32} color="#709775" />
                    </View>
                  )}
                  <Text style={styles.modalStoreName}>{selectedVoucher.partnerName}</Text>
                </View>

                <View style={styles.detailsSection}>
                  <DetailRow label="Voucher Title" value={selectedVoucher.title} />
                  <DetailRow label="Description" value={selectedVoucher.description} />
                  <DetailRow label="Voucher Code" value={selectedVoucher.voucherCode} />
                  <DetailRow label="Quantity" value={`${selectedVoucher.availableQuantity || 0} / ${selectedVoucher.totalQuantity}`} />
                  <DetailRow label="Status" value={selectedVoucher.status || "active"} />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEditVoucher(selectedVoucher)}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.editButtonText}>Edit Voucher</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.closeModalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeModalText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#131313", padding: 16, paddingTop: 40 },
  listContainer: { paddingBottom: 100 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 20, fontSize: 14 },

  itemBox: {
    width: ITEM_WIDTH,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 12,
    position: "relative",
  },
  logoContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH / 2,
    marginBottom: 8,
  },
  storeLogo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  logoPlaceholder: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  storeName: {
    color: "#709775",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 8,
  },
  voucherTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    width: "100%",
    paddingHorizontal: 8,
  },
  deleteButton: {
    padding: 4,
    alignSelf: "center",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#709775",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalStoreInfo: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalStoreLogo: {
    width: 80,
    height: 40,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: "cover",
  },
  modalLogoPlaceholder: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  modalStoreName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  detailsSection: {
    padding: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailLabel: {
    color: "#709775",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  detailValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "400",
    flex: 2,
    textAlign: "right",
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#709775",
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  closeModalButton: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#709775",
  },
  closeModalText: {
    color: "#709775",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AdminPartnersVoucher;