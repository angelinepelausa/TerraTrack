import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { badgeService } from '../services/badgeService';

export const BadgesSection = ({
  unlockedBadges,
  displayedBadges,
  badgeEditMode,
  tempDisplayedBadges,
  enterBadgeEditMode,
  cancelBadgeEdit,
  saveDisplayedBadges,
  toggleBadgeSelection,
  navigation,
  userId
}) => {
  const badgesToDisplay = badgeEditMode ? unlockedBadges : displayedBadges;
  const badgesCount = badgesToDisplay.length;

  const handleBadgePress = async (badge) => {
    if (badgeEditMode) {
      toggleBadgeSelection(badge);
    } else {
      try {
        await badgeService.navigateToBadgeDetail(navigation, badge);
      } catch (err) {
        console.error('Error handling badge press:', err);
      }
    }
  };

  const handleSaveBadges = async () => {
    try {
      await saveDisplayedBadges();
    } catch (err) {
      Alert.alert('Error', 'Failed to save badge selection');
    }
  };

  const getBadgesContainerStyle = (badgesCount) => {
    if (badgeEditMode) {
      return styles.badgesContainerGrid;
    } else {
      return badgesCount === 3 ? styles.badgesContainerCentered : styles.badgesContainerLeft;
    }
  };

  const getBadgeWrapperStyle = (badgesCount, index) => {
    if (badgeEditMode) {
      return styles.badgeWrapperGrid;
    } else {
      return badgesCount === 3 ? styles.badgeWrapperCentered : styles.badgeWrapperLeft;
    }
  };

  const isBadgeSelected = (badge) => {
    return tempDisplayedBadges.some(b => b.id === badge.id);
  };

  return (
    <View style={[styles.section, { backgroundColor: '#CCCCCC' }]}>
      <View style={styles.badgeHeader}>
        <Text style={styles.sectionTitle}>Badges</Text>
        {unlockedBadges.length >= 4 && !badgeEditMode && (
          <TouchableOpacity 
            style={styles.editBadgeButton}
            onPress={enterBadgeEditMode}
          >
            <Ionicons name="pencil" size={20} color="#709775" />
          </TouchableOpacity>
        )}
        {badgeEditMode && (
          <View style={styles.editModeButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={cancelBadgeEdit}
            >
              <Ionicons name="close" size={20} color="#ff6b6b" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveBadges}
            >
              <Ionicons name="checkmark" size={20} color="#709775" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {badgesCount === 0 ? (
        <View style={styles.noBadgesContainer}>
          <Text style={{ color: '#888', fontStyle: 'italic' }}>No badges yet</Text>
        </View>
      ) : (
        <View style={getBadgesContainerStyle(badgesCount)}>
          {badgesToDisplay.map((badge, index) => (
            <TouchableOpacity 
              key={badge.id}
              onPress={() => handleBadgePress(badge)}
              style={[
                getBadgeWrapperStyle(badgesCount, index),
                badgeEditMode && styles.badgeEditWrapper
              ]}
            >
              <Image
                source={{ uri: badge.imageurl }}
                style={styles.badgeImage}
              />
              {badgeEditMode && (
                <View style={[
                  styles.badgeSelectionOverlay,
                  { backgroundColor: isBadgeSelected(badge) 
                    ? 'rgba(112, 151, 117, 0.7)' 
                    : 'rgba(255, 255, 255, 0.3)' 
                  }
                ]}>
                  <Ionicons 
                    name={isBadgeSelected(badge) ? 'checkmark-circle' : 'remove-circle'} 
                    size={24} 
                    color="#fff" 
                  />
                  <Text style={styles.badgeSelectionText}>
                    {isBadgeSelected(badge) ? 'Selected' : 'Not Selected'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {badgeEditMode && (
        <View style={styles.badgeSelectionNote}>
          <Text style={styles.badgeSelectionText}>
            {tempDisplayedBadges.length}/3 badges selected. Tap badges to select/deselect.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  section: {
    width: '90%',
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#709775',
    fontWeight: '700',
    fontSize: 16,
  },
  editModeButtons: {
    flexDirection: 'row',
  },
  editBadgeButton: {
    padding: 5,
  },
  cancelButton: {
    padding: 5,
    marginRight: 10,
  },
  saveButton: {
    padding: 5,
  },
  badgesContainerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 10,
  },
  badgeWrapperGrid: {
    width: '30%',
    marginHorizontal: '1.5%',
    marginBottom: 15,
    position: 'relative',
    alignItems: 'center',
  },
  badgesContainerCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  badgesContainerLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  noBadgesContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  badgeWrapperCentered: {
    marginHorizontal: 5,
    marginBottom: 10,
    position: 'relative',
  },
  badgeWrapperLeft: {
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  badgeEditWrapper: {
    opacity: 0.9,
  },
  badgeImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  badgeSelectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeSelectionText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  badgeSelectionNote: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#709775',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  }
};