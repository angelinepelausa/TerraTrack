import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { educationalContentRepository } from '../repositories/educationalContentRepository';
import { getUserTerraCoins } from '../repositories/userRepository';
import { hasAttemptedQuiz } from '../repositories/quizAttemptsRepository';
import EducationalContentCard from '../components/EducationalContentCard';
import HeaderRow from '../components/HeaderRow'; 

const { width } = Dimensions.get('window');

const EducationalScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [terraCoins, setTerraCoins] = useState(0);

  useEffect(() => {
    if (user) {
      fetchEducationalContent();
      fetchTerraCoins();
    }
  }, [user]);

  const fetchEducationalContent = async () => {
    setLoading(true);
    try {
      const contentData = await educationalContentRepository.getAllContent();

      const filteredData = [];
      for (const item of contentData) {
        const attempted = await hasAttemptedQuiz(item.id);
        if (!attempted) {
          filteredData.push(item);
        }
      }

      setContent(filteredData);
    } catch (error) {
      console.error('Error loading educational content:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredContent = content.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

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

      <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
        <HeaderRow
          title="Educational Materials"
          showBack={true}
          onBackPress={() => navigation.navigate('HomeScreen')}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Image
            source={require('../assets/images/Search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchBar}
            placeholder="Search"
            placeholderTextColor="#131313"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredContent.length === 0 ? (
          <Text style={styles.emptyText}>No educational content available</Text>
        ) : (
          <FlatList
            data={filteredContent}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EducationalContentCard
                item={item}
                variant="user" 
                onPress={() =>
                  navigation.navigate('EducationalDetailScreen', { content: item })
                }
              />
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    alignSelf: 'flex-end',
  },
  coinImage: {
    width: 20,
    height: 20,
    marginRight: 6,
    resizeMode: 'contain',
  },
  coinText: { color: '#131313', fontWeight: 'bold', fontSize: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCCCCC',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#131313',
    marginRight: 8,
  },
  searchBar: { flex: 1, paddingVertical: 14, color: '#131313' },
  listContainer: { paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: '#CCCCCC', marginTop: 20 },
});

export default EducationalScreen;