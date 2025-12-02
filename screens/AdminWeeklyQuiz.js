import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import HeaderRow from '../components/HeaderRow';
import SearchRow from '../components/SearchRow';
import WeeklyQuizCard from '../components/WeeklyQuizCard';
import { weeklyQuizRepository } from '../repositories/weeklyQuizRepository';

const AdminWeeklyQuiz = () => {
  const navigation = useNavigation();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Set up real-time listener
    const unsubscribe = firestore()
      .collection('weekly_quizzes')
      .orderBy('createdAt', 'desc') // Sort by newest first
      .onSnapshot({
        next: (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore timestamps to Date objects if needed
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            expiresAt: doc.data().expiresAt?.toDate() || null,
          }));
          setQuizzes(data);
          setLoading(false);
        },
        error: (error) => {
          console.error('Real-time listener error:', error);
          setLoading(false);
          // Fallback: try to fetch once
          fetchQuizzesOnce();
        }
      });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Optional: One-time fetch as fallback
  const fetchQuizzesOnce = async () => {
    try {
      const data = await weeklyQuizRepository.getAllQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error('Fallback fetch error:', err);
      Alert.alert('Error', 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  // Optional: Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // If you want to ensure fresh data when screen is focused
      // The real-time listener already handles this, but you can add manual refresh if needed
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Quiz',
      'Are you sure you want to delete this weekly quiz?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await weeklyQuizRepository.deleteQuiz(id);
              // Real-time listener will automatically update UI
              // No need to manually update state
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to delete quiz');
            }
          },
        },
      ]
    );
  };

  const filteredQuizzes = quizzes.filter(
    q => (q.question || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
         (q.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && quizzes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderRow
        title="Weekly Quizzes"
        onBackPress={() => navigation.goBack()}
      />
      
      <SearchRow
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPress={() => navigation.navigate('AddWeeklyQuiz')}
        placeholder="Search quizzes..."
      />

      {filteredQuizzes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No matching quizzes found' : 'No weekly quizzes available'}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first quiz
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredQuizzes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WeeklyQuizCard
              item={item}
              onDelete={() => handleDelete(item.id)}
              onPress={() => navigation.navigate('AddWeeklyQuiz', { 
                quiz: item,
                // Pass callback for optimistic updates if needed
                onUpdate: () => {/* Optional callback */} 
              })}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    paddingTop: 40, 
    backgroundColor: '#131313' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#131313' 
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 20, 
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  listContainer: { 
    paddingBottom: 20,
    paddingTop: 10,
  },
});

export default AdminWeeklyQuiz;