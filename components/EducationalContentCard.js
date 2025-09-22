import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const CARD_HEIGHT = 120; 
const IMAGE_SIZE = 100; 

const EducationalContentCard = ({ item, onPress, onDelete, variant = 'user' }) => {
  const isAdmin = variant === 'admin';
  const backgroundColor = isAdmin ? '#1f1f1f' : '#CCCCCC';
  const textColor = isAdmin ? '#fff' : '#131313';
  const descriptionColor = isAdmin ? '#aaa' : '#666';

  return (
    <TouchableOpacity 
      style={[styles.contentCard, { backgroundColor }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.cardRow}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: isAdmin ? '#333' : '#D9D9D9' }]} />
        )}

        <View style={styles.textContainer}>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.cardDescription, { color: descriptionColor }]} numberOfLines={3}>
            {item.description}
          </Text>
        </View>

        {onDelete && (
          <TouchableOpacity onPress={onDelete}>
            <Text style={[styles.deleteText, { color: isAdmin ? '#ff4d4d' : '#d32f2f' }]}>
              Delete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Keep the base styles as is
const styles = StyleSheet.create({
  contentCard: {
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
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
  deleteText: {
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default EducationalContentCard;