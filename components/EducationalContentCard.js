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
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    height: CARD_HEIGHT,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  cardImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#131313',
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#415D43',
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
  },
  deleteText: {
    color: 'red',
    fontWeight: '400',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default EducationalContentCard;
