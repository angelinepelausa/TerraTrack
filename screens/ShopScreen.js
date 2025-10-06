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
import BuyAvatar from '../components/BuyAvatar';
import HeaderRow from '../components/HeaderRow';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 64) / 3;
const ITEM_MARGIN = 16;

const ShopScreen = () => {
  const { user } = useAuth();
  const [terraCoins, setTerraCoins] = useState(0);
  const [allAvatars, setAllAvatars] = useState([]);
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [filter, setFilter] = useState('available');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTerraCoins();
      fetchAvatarsAndPurchases();
    }
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [filter, allAvatars, purchasedIds]);

  const fetchTerraCoins = async () => {
    try {
      const result = await getUserTerraCoins(user.uid);
      if (result.success) {
        setTerraCoins(result.terraCoins || 0);
      }
    } catch (error) {
      console.error('Error fetching TerraCoins:', error);
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
    }
  };

  const applyFilter = () => {
    if (filter === 'available') {
      const available = allAvatars.filter(
        (a) => a.terracoin > 0 && !purchasedIds.includes(a.id)
      );
      setAvatars(available);
    } else if (filter === 'owned') {
      const owned = allAvatars.filter(
        (a) => purchasedIds.includes(a.id) || a.terracoin === 0
      );
      setAvatars(owned);
    }
  };

  const handleAvatarPress = (avatar) => {
    setSelectedAvatar(avatar);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Header Row with consistent horizontal padding */}
      <HeaderRow title="Shop" />

      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image
            source={require('../assets/images/TerraCoin.png')}
            style={styles.coinImage}
          />
          <Text style={styles.coinText}>{terraCoins}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.header}>Terra Shop</Text>

        <View style={styles.avatarsHeader}>
          <Text style={styles.avatarsTitle}>Avatars</Text>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={styles.dropdownButtonText}>
                {filter === 'available' ? 'Available' : 'Owned'}
              </Text>
            </TouchableOpacity>
            {dropdownOpen && (
              <View style={styles.dropdownOverlay}>
                {['available', 'owned'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.option,
                      {
                        backgroundColor:
                          filter === option ? '#709775' : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setFilter(option);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={{
                        color: filter === option ? '#fff' : '#ccc',
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
              {filter === 'available'
                ? 'No avatars available'
                : 'No owned avatars yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={avatars}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={{
              justifyContent:
                avatars.length <= 2 ? 'flex-start' : 'space-between',
              marginBottom: 24,
            }}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item, index }) => {
              const isLastInRow = (index + 1) % 3 === 0;
              return (
                <TouchableOpacity
                  style={[
                    styles.avatarBox,
                    {
                      width: ITEM_SIZE,
                      height: ITEM_SIZE + 80,
                      marginRight: isLastInRow ? 0 : ITEM_MARGIN,
                    },
                  ]}
                  onPress={() => handleAvatarPress(item)}
                  disabled={filter === 'owned'}
                >
                  <Image
                    source={{ uri: item.imageurl }}
                    style={styles.avatarImage}
                  />
                  <Text style={styles.avatarName}>{item.name}</Text>
                  {filter === 'available' && (
                    <View style={styles.priceBox}>
                      <Image
                        source={require('../assets/images/TerraCoin.png')}
                        style={styles.priceCoin}
                      />
                      <Text style={styles.priceText}>{item.terracoin}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <BuyAvatar
        visible={modalVisible}
        avatar={selectedAvatar}
        onClose={() => setModalVisible(false)}
        onPurchaseSuccess={() => {
          fetchTerraCoins();
          fetchAvatarsAndPurchases();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  topBar: {
    height: 90,
    backgroundColor: '#415D43',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 10,
  },
  coinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  coinImage: {
    width: 20,
    height: 20,
    marginRight: 6,
    resizeMode: 'contain',
  },
  coinText: { color: '#131313', fontWeight: 'bold', fontSize: 12 },
  header: {
    color: '#CCCCCC',
    fontSize: 20,
    fontFamily: 'DMSans-Bold',
    marginBottom: 12,
    textAlign: 'left',
  },
  avatarsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarsTitle: {
    color: '#CCCCCC',
    fontSize: 18,
    fontFamily: 'DMSans-Bold',
  },
  dropdownWrapper: {
    position: 'relative',
  },
  dropdownButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
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
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  avatarBox: {
    backgroundColor: '#CCCCCC',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  avatarImage: {
    width: '80%',
    height: '60%',
    resizeMode: 'contain',
    marginBottom: 8,
  },
  avatarName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#131313',
    marginBottom: 6,
    textAlign: 'center',
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  priceCoin: {
    width: 16,
    height: 16,
    marginRight: 5,
    resizeMode: 'contain',
  },
  priceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#131313',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999999',
    fontSize: 16,
    fontFamily: 'DMSans-Regular',
  },
});

export default ShopScreen;
