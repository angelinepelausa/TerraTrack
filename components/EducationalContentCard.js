import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const CARD_HEIGHT = 120; 
const IMAGE_SIZE = 100; 

const EducationalContentCard = ({ item, onPress, onDelete }) => {
  return (
    <TouchableOpacity style={styles.contentCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardRow}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.placeholderImage} />
        )}

        <View style={styles.textContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={3}>
            {item.description}
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
  contentCard: {
    backgroundColor: '#1f1f1f', 
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    height: CARD_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  cardImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    marginRight: 12,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#333',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#aaa',
    fontSize: 14,
  },
  deleteText: {
    color: '#ff4d4d',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default EducationalContentCard;
