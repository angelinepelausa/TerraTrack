import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getUserTerraCoins } from '../repositories/userRepository';
import { avatarsRepository } from '../repositories/avatarsRepository';
import { purchasesRepository } from '../repositories/purchasesRepository';
import { voucherRepository } from '../repositories/voucherRepository';
import BuyAvatar from '../components/BuyAvatar';
import BuyVoucher from '../components/BuyVoucher';
import HeaderRow from '../components/HeaderRow';
import ConfirmationPopup from '../components/ConfirmationPopup';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 64) / 3;
const ITEM_MARGIN = 16;
const VOUCHER_WIDTH = (width - 48) / 2;

const ShopScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [terraCoins, setTerraCoins] = useState(0);
  const [allAvatars, setAllAvatars] = useState([]);
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [allVouchers, setAllVouchers] = useState([]); 
  const [filteredVouchers, setFilteredVouchers] = useState([]); 
  const [userVouchers, setUserVouchers] = useState([]);
  const [avatarFilter, setAvatarFilter] = useState('available');
  const [voucherFilter, setVoucherFilter] = useState('available');
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [voucherDropdownOpen, setVoucherDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (user) {
      fetchTerraCoins();
      fetchAvatarsAndPurchases();
      fetchVouchers();
      fetchUserVouchers();
    }
  }, [user]);

  useEffect(() => {
    applyAvatarFilter();
  }, [avatarFilter, allAvatars, purchasedIds]);

  useEffect(() => {
    applyVoucherFilter();
  }, [voucherFilter, allVouchers, userVouchers]);

  const showMessage = (title, message, type = 'success') => {
    setPopupConfig({
      title,
      message,
      type
    });
    setShowPopup(true);
  };

  const fetchTerraCoins = async () => {
    try {
      const result = await getUserTerraCoins(user.uid);
      if (result.success) {
        setTerraCoins(result.terraCoins || 0);
      }
    } catch (error) {
      console.error('Error fetching TerraCoins:', error);
      showMessage('Error', 'Failed to load your Terra Coins balance.', 'error');
    }
  };

  const fetchAvatarsAndPurchases = async () => {
    try {
      const all = await avatarsRepository.getAllAvatars();
      const purchases = await purchasesRepository.getUserPurchases(user.uid);
      const ids = purchases.list || [];

      setAllAvatars(all);
      setPurchasedIds(ids);
    } catch (err) {
      console.error('Error fetching avatars/purchases:', err);
      showMessage('Error', 'Failed to load avatars. Please try again.', 'error');
    }
  };

  const fetchUserVouchers = async () => {
    try {
      const result = await purchasesRepository.getUserVouchers(user.uid);
      const userVoucherList = result.list || [];
      setUserVouchers(userVoucherList);
    } catch (err) {
      console.error('Error fetching user vouchers:', err);
      setUserVouchers([]);
      showMessage('Error', 'Failed to load your vouchers.', 'error');
    }
  };

  const fetchVouchers = async () => {
    try {
      setLoading(true);
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
      
      const activeVouchers = vouchersWithLogos.filter(
        voucher => voucher.status === 'active' && 
        (voucher.availableQuantity > 0 || voucher.totalQuantity > 0)
      );
      
      setAllVouchers(activeVouchers);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
      showMessage("Error", "Failed to load vouchers. Please check your connection.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyAvatarFilter = () => {
    if (avatarFilter === 'available') {
      const available = allAvatars.filter(
        (a) => a.terracoin > 0 && !purchasedIds.includes(a.id)
      );
      setAvatars(available);
    } else if (avatarFilter === 'owned') {
      const owned = allAvatars.filter(
        (a) => purchasedIds.includes(a.id) || a.terracoin === 0
      );
      setAvatars(owned);
    }
  };

  const applyVoucherFilter = () => {
    if (voucherFilter === 'available') {
      const userVoucherIds = userVouchers.map(v => v.id);
      const available = allVouchers.filter(voucher => !userVoucherIds.includes(voucher.id));
      setFilteredVouchers(available);
    } else if (voucherFilter === 'owned') {
      setFilteredVouchers(userVouchers);
    }
  };

  const handleAvatarPress = (avatar) => {
    if (purchasedIds.includes(avatar.id)) {
      showMessage('Avatar Owned', `You already own the "${avatar.name}" avatar!`, 'success');
      return;
    }

    if (avatar.terracoin > terraCoins) {
      showMessage(
        'Insufficient Coins', 
        `You need ${avatar.terracoin} Terra Coins to buy this avatar. Complete more tasks to earn coins!`,
        'error'
      );
      return;
    }

    setSelectedAvatar(avatar);
    setAvatarModalVisible(true);
  };

  const handleVoucherPress = (voucher) => {
    const isPurchased = isVoucherPurchased(voucher.id);
    const isClaimed = isVoucherClaimed(voucher.id);

    if (isClaimed) {
      showMessage('Voucher Claimed', 'This voucher has already been claimed and used.', 'success');
      return;
    }

    if (isPurchased && !isClaimed) {
      showMessage(
        'Voucher Purchased', 
        'You already own this voucher! Go to "Owned" tab to claim it.',
        'success'
      );
      return;
    }

    if (voucher.terraCoinCost > terraCoins) {
      showMessage(
        'Insufficient Coins', 
        `You need ${voucher.terraCoinCost} Terra Coins to buy this voucher. Complete more tasks to earn coins!`,
        'error'
      );
      return;
    }

    setSelectedVoucher(voucher);
    setVoucherModalVisible(true);
  };

  const isVoucherClaimed = (voucherId) => {
    const userVoucher = userVouchers.find(v => v.id === voucherId);
    return userVoucher?.status === 'claimed';
  };

  const isVoucherPurchased = (voucherId) => {
    return userVouchers.some(v => v.id === voucherId);
  };

  const handlePurchaseSuccess = (itemName, itemType) => {
    fetchTerraCoins();
    fetchAvatarsAndPurchases();
    fetchVouchers();
    fetchUserVouchers();
    
    showMessage(
      'Purchase Successful!', 
      `You've successfully purchased the ${itemName} ${itemType}!`,
      'success'
    );
  };

  const renderAvatarItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.avatarBox,
        {
          width: ITEM_SIZE,
          height: ITEM_SIZE + 80,
          marginLeft: index === 0 ? 0 : 12,
        },
      ]}
      onPress={() => handleAvatarPress(item)}
    >
      <Image
        source={{ uri: item.imageurl }}
        style={styles.avatarImage}
      />
      <Text style={styles.avatarName}>{item.name}</Text>
      {avatarFilter === 'available' && (
        <View style={styles.priceBox}>
          <Image
            source={require('../assets/images/TerraCoin.png')}
            style={styles.priceCoin}
          />
          <Text style={styles.priceText}>{item.terracoin}</Text>
        </View>
      )}
      {avatarFilter === 'owned' && purchasedIds.includes(item.id) && (
        <View style={styles.ownedBadge}>
          <Text style={styles.ownedText}>OWNED</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderVoucherItem = ({ item, index }) => {
    const isClaimed = isVoucherClaimed(item.id);
    const isPurchased = isVoucherPurchased(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.voucherItem,
          {
            width: VOUCHER_WIDTH,
            marginLeft: index === 0 ? 0 : 12,
          },
        ]}
        onPress={() => handleVoucherPress(item)}
      >
        <View style={styles.voucherLogoContainer}>
          {item.partnerLogo ? (
            <Image source={{ uri: item.partnerLogo }} style={styles.voucherStoreLogo} />
          ) : (
            <View style={[styles.voucherStoreLogo, styles.voucherLogoPlaceholder]}>
              <Text style={styles.storeIcon}>🏪</Text>
            </View>
          )}
        </View>

        <Text style={styles.voucherStoreName} numberOfLines={1}>
          {item.partnerName}
        </Text>

        <Text style={styles.voucherTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.voucherPriceBox}>
          <Image
            source={require('../assets/images/TerraCoin.png')}
            style={styles.voucherPriceCoin}
          />
          <Text style={styles.voucherPriceText}>{item.terraCoinCost}</Text>
        </View>

        {isClaimed && (
          <View style={styles.claimedOverlay}>
            <Text style={styles.claimedText}>CLAIMED</Text>
          </View>
        )}

        {isPurchased && !isClaimed && voucherFilter === 'owned' && (
          <View style={styles.unclaimedBadge}>
            <Text style={styles.unclaimedText}>UNCLAIMED</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image
            source={require('../assets/images/TerraCoin.png')}
            style={styles.coinImage}
          />
          <Text style={styles.coinText}>{terraCoins}</Text>
        </View>
      </View>

      <View style={styles.headerContainer}>
        <HeaderRow 
          title="Terra Shop" 
          onBackPress={() => navigation.goBack()}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Avatars</Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setAvatarDropdownOpen(!avatarDropdownOpen)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.dropdownButtonText}>
                    {avatarFilter === 'available' ? 'Available' : 'Owned'}
                  </Text>
                  <Ionicons
                    name={avatarDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#fff"
                    style={{ marginLeft: 6 }}
                  />
                </View>
              </TouchableOpacity>
              {avatarDropdownOpen && (
                <View style={styles.dropdownOverlay}>
                  {['available', 'owned'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            avatarFilter === option ? '#709775' : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setAvatarFilter(option);
                        setAvatarDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={{
                          color: avatarFilter === option ? '#fff' : '#ccc',
                          fontSize: 13,
                        }}
                      >
                        {option === 'available' ? 'Available' : 'Owned'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {avatars.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {avatarFilter === 'available'
                  ? 'No avatars available'
                  : 'No owned avatars yet'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={avatars}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
              renderItem={renderAvatarItem}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vouchers</Text>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setVoucherDropdownOpen(!voucherDropdownOpen)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.dropdownButtonText}>
                    {voucherFilter === 'available' ? 'Available' : 'Owned'}
                  </Text>
                  <Ionicons
                    name={voucherDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#fff"
                    style={{ marginLeft: 6 }}
                  />
                </View>
              </TouchableOpacity>
              {voucherDropdownOpen && (
                <View style={styles.dropdownOverlay}>
                  {['available', 'owned'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.option,
                        {
                          backgroundColor:
                            voucherFilter === option ? '#709775' : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setVoucherFilter(option);
                        setVoucherDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={{
                          color: voucherFilter === option ? '#fff' : '#ccc',
                          fontSize: 13,
                        }}
                      >
                        {option === 'available' ? 'Available' : 'Owned'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Loading vouchers...</Text>
            </View>
          ) : filteredVouchers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {voucherFilter === 'available' ? 'No vouchers available' : 'No purchased vouchers yet'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredVouchers}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContent}
              renderItem={renderVoucherItem}
            />
          )}
        </View>

        <View style={styles.smallTextContainer}>
          <Text style={styles.smallText}>
            To earn more Terra Coins, complete tasks, read materials, and answer quizzes.
          </Text>
        </View>
      </View>

      <BuyAvatar
        visible={avatarModalVisible}
        avatar={selectedAvatar}
        onClose={() => setAvatarModalVisible(false)}
        onPurchaseSuccess={() => {
          if (selectedAvatar) {
            handlePurchaseSuccess(selectedAvatar.name, 'avatar');
          }
        }}
      />

      <BuyVoucher
        visible={voucherModalVisible}
        voucher={selectedVoucher}
        isPurchased={isVoucherPurchased(selectedVoucher?.id)}
        onClose={() => setVoucherModalVisible(false)}
        onPurchaseSuccess={() => {
          if (selectedVoucher) {
            handlePurchaseSuccess(selectedVoucher.title, 'voucher');
          }
        }}
      />

      <ConfirmationPopup
        visible={showPopup}
        title={popupConfig.title}
        message={popupConfig.message}
        confirmText="OK"
        type={popupConfig.type}
        onConfirm={() => setShowPopup(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  topBar: {
    height: 90,
    backgroundColor: '#415D43',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 10,
  },
  headerContainer: { paddingHorizontal: 16 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  coinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  coinImage: { width: 20, height: 20, marginRight: 6, resizeMode: 'contain' },
  coinText: { color: '#131313', fontWeight: 'bold', fontSize: 12 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#CCCCCC', fontSize: 18, fontFamily: 'DMSans-Bold' },
  horizontalListContent: { paddingHorizontal: 4, paddingVertical: 8 },
  dropdownWrapper: { position: 'relative' },
  dropdownButton: { backgroundColor: '#2A2A2A', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  dropdownButtonText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  dropdownOverlay: {
    position: 'absolute',
    top: 35,
    right: 0,
    width: 140,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  option: { paddingVertical: 10, paddingHorizontal: 12, borderBottomColor: '#333', borderBottomWidth: 1 },
  avatarBox: { backgroundColor: '#CCCCCC', borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 10, position: 'relative' },
  avatarImage: { width: '80%', height: '60%', resizeMode: 'contain', marginBottom: 8 },
  avatarName: { fontSize: 13, fontWeight: 'bold', color: '#131313', marginBottom: 6, textAlign: 'center' },
  priceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DDDDDD', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 3 },
  priceCoin: { width: 16, height: 16, marginRight: 5, resizeMode: 'contain' },
  priceText: { fontSize: 12, fontWeight: 'bold', color: '#131313' },
  ownedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#709775', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ownedText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', fontFamily: 'DMSans-Bold' },
  voucherItem: { backgroundColor: '#CCCCCC', borderRadius: 12, overflow: "hidden", alignItems: "center", paddingBottom: 12, position: "relative", height: 200 },
  voucherLogoContainer: { width: '100%', height: 90, marginBottom: 8 },
  voucherStoreLogo: { width: "100%", height: "100%", resizeMode: "cover" },
  voucherLogoPlaceholder: { backgroundColor: "#DDDDDD", justifyContent: "center", alignItems: "center" },
  storeIcon: { fontSize: 24 },
  voucherStoreName: { color: "#709775", fontSize: 12, fontWeight: "600", marginBottom: 4, textAlign: "center", width: "100%", paddingHorizontal: 8 },
  voucherTitle: { color: "#131313", fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 8, width: "100%", paddingHorizontal: 8 },
  voucherPriceBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#DDDDDD", borderRadius: 30, paddingHorizontal: 10, paddingVertical: 3 },
  voucherPriceCoin: { width: 16, height: 16, marginRight: 5, resizeMode: "contain" },
  voucherPriceText: { fontSize: 12, fontWeight: "bold", color: "#131313" },
  claimedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  claimedText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', fontFamily: 'DMSans-Bold' },
  unclaimedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFA500', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  unclaimedText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', fontFamily: 'DMSans-Bold' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#999999', fontSize: 16, fontFamily: 'DMSans-Regular' },
  smallTextContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  smallText: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'DMSans-Regular',
  },
});

export default ShopScreen;