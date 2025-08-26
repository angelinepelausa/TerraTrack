import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { educationalContentRepository } from '../repositories/educationalContentRepository';
import EducationalContentCard from '../components/EducationalContentCard';

const AdminEducationalMaterials = () => {
  const navigation = useNavigation();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEducationalContent();
  }, []);

  const fetchEducationalContent = async () => {
    setLoading(true);
    try {
      const contentData = await educationalContentRepository.getAllContent();
      setContent(contentData);
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to delete this educational content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await educationalContentRepository.deleteContent(id);
              setContent((prev) => prev.filter((item) => item.id !== id));
            } catch (err) {
              console.error('Error deleting content:', err);
              Alert.alert('Error', 'Failed to delete content. Please try again.');
            }
          },
        },
      ]
    );
  };

  const filteredContent = content.filter(
    (item) =>
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
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
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Educational Materials</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddEducationalMaterial')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Image
          source={require('../assets/images/Search.png')}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchBar}
          placeholder="Search"
          placeholderTextColor="#888"
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
              onPress={() =>
                navigation.navigate('AddEducationalMaterial', { content: item })
              }
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 20,
  },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#709775' },
  addButton: {
    backgroundColor: '#709775',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 25,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchIcon: { width: 18, height: 18, tintColor: '#fff', marginRight: 8 },
  searchBar: { flex: 1, paddingVertical: 12, color: '#fff' },
  listContainer: { paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
});

export default AdminEducationalMaterials;
