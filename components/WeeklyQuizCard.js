import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const CARD_HEIGHT = 120;
const IMAGE_SIZE = 100;

const WeeklyQuizCard = ({ item, onDelete, onPress }) => {
  const formattedDate = item.id; 

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.row}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage} />
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.date} numberOfLines={1}>
            {formattedDate}
          </Text>
        </View>

        {onDelete && (
          <TouchableOpacity onPress={onDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    height: CARD_HEIGHT,
  },
  row: { flexDirection: 'row', alignItems: 'center', height: '100%' },
  image: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 8, marginRight: 12, resizeMode: 'cover' },
  placeholderImage: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 8, marginRight: 12, backgroundColor: '#ccc' },
  textContainer: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#131313', marginBottom: 4 },
  date: { fontSize: 14, color: '#415D43' },
  deleteText: { color: 'red', fontSize: 12, marginLeft: 8 },
});

export default WeeklyQuizCard;
