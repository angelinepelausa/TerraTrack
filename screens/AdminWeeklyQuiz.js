import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await weeklyQuizRepository.getAllQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
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
              setQuizzes(prev => prev.filter(q => q.id !== id));
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
    q => (q.question || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
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
        <Text style={styles.emptyText}>
          No weekly quizzes available
        </Text>
      ) : (
        <FlatList
          data={filteredQuizzes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WeeklyQuizCard
              item={item}
              onDelete={() => handleDelete(item.id)}
              onPress={() => navigation.navigate('AddWeeklyQuiz', { quiz: item })}
            />
          )}
          contentContainerStyle={styles.listContainer}
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
  emptyText: { 
    textAlign: 'center', 
    marginTop: 20, 
    color: '#888' 
  },
  listContainer: { 
    paddingBottom: 20 
  },
});

export default AdminWeeklyQuiz;