import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, UIManager, Image, Modal
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { addCommunityProgress, updateCommunityProgress, getCommunityProgress } from '../repositories/communityProgressRepository';
import { uploadImageToCloudinary } from '../services/cloudinary';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const rankOptions = ["top1", "top2", "top3", "top4to10", "top11plus"];

// Helper function to get current quarter
const getCurrentQuarter = () => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  
  if (month >= 0 && month <= 2) return { year, quarter: 'Q1' };
  else if (month >= 3 && month <= 5) return { year, quarter: 'Q2' };
  else if (month >= 6 && month <= 8) return { year, quarter: 'Q3' };
  else return { year, quarter: 'Q4' };
};

// Generate years array (current year to +20 years)
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 20; i++) {
    years.push((currentYear + i).toString());
  }
  return years;
};

const AddCommunityProgress = ({ navigation, route }) => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState('Q1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [rewards, setRewards] = useState({
    top1: { terraPoints: '', terraCoins: '' },
    top2: { terraPoints: '', terraCoins: '' },
    top3: { terraPoints: '', terraCoins: '' },
    top4to10: { terraPoints: '', terraCoins: '' },
    top11plus: { terraPoints: '', terraCoins: '' },
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalYearQuarter, setOriginalYearQuarter] = useState('');
  const [existingQuarters, setExistingQuarters] = useState({});
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 });
  const years = generateYears();

  // Check existing quarters and set initial year
  useEffect(() => {
    checkExistingQuartersAndSetYear();
  }, []);

  // Check if we're editing an existing quarter
  useEffect(() => {
    if (route.params?.quarterData) {
      const quarterData = route.params.quarterData;
      setIsEditing(true);
      setOriginalYearQuarter(quarterData.id);
      
      const [yearPart, quarterPart] = quarterData.id.split('-');
      setYear(yearPart);
      setQuarter(quarterPart);
      
      setTitle(quarterData.title || '');
      setDescription(quarterData.description || '');
      setGoal(quarterData.goal?.toString() || '');
      setImageUri(quarterData.image || '');
      setRewards(quarterData.rewards || {
        top1: { terraPoints: '', terraCoins: '' },
        top2: { terraPoints: '', terraCoins: '' },
        top3: { terraPoints: '', terraCoins: '' },
        top4to10: { terraPoints: '', terraCoins: '' },
        top11plus: { terraPoints: '', terraCoins: '' },
      });
    }
  }, [route.params?.quarterData]);

  // Check existing quarters when year changes
  useEffect(() => {
    if (!isEditing) {
      checkExistingQuarters();
    }
  }, [year]);

  const checkExistingQuartersAndSetYear = async () => {
    try {
      const current = getCurrentQuarter();
      let foundAvailableYear = false;
      
      // Check current year first
      const currentYearQuarters = {};
      for (const q of quarters) {
        const yearQuarter = `${current.year}-${q}`;
        try {
          const data = await getCommunityProgress(yearQuarter);
          currentYearQuarters[q] = !!data;
        } catch (error) {
          currentYearQuarters[q] = false;
        }
      }
      
      // If all quarters exist in current year, check next year
      const allQuartersExist = quarters.every(q => currentYearQuarters[q]);
      
      if (allQuartersExist) {
        // Check next year
        const nextYear = current.year + 1;
        const nextYearQuarters = {};
        
        for (const q of quarters) {
          const yearQuarter = `${nextYear}-${q}`;
          try {
            const data = await getCommunityProgress(yearQuarter);
            nextYearQuarters[q] = !!data;
          } catch (error) {
            nextYearQuarters[q] = false;
          }
        }
        
        // Set to next year and its existing quarters
        setYear(nextYear.toString());
        setExistingQuarters(nextYearQuarters);
        
        // Find first available quarter in next year
        const availableQuarter = quarters.find(q => !nextYearQuarters[q]);
        if (availableQuarter) {
          setQuarter(availableQuarter);
        }
      } else {
        // Use current year and its existing quarters
        setYear(current.year.toString());
        setExistingQuarters(currentYearQuarters);
        
        // Find first available quarter in current year
        const availableQuarter = quarters.find(q => !currentYearQuarters[q]);
        if (availableQuarter) {
          setQuarter(availableQuarter);
        }
      }
    } catch (error) {
      console.error('Error checking existing quarters:', error);
      // Fallback to current year and quarter
      const current = getCurrentQuarter();
      setYear(current.year.toString());
      setQuarter(current.quarter);
    }
  };

  const checkExistingQuarters = async () => {
    try {
      const existing = {};
      for (const q of quarters) {
        const yearQuarter = `${year}-${q}`;
        try {
          const data = await getCommunityProgress(yearQuarter);
          existing[q] = !!data;
        } catch (error) {
          existing[q] = false;
        }
      }
      setExistingQuarters(existing);
    } catch (error) {
      console.error('Error checking existing quarters:', error);
    }
  };

  const isQuarterDisabled = (q) => {
    if (isEditing) return false;

    const current = getCurrentQuarter();
    const currentYear = current.year;
    const currentQuarter = current.quarter;
    
    // Convert quarter to number for comparison
    const quarterNum = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
    const selectedQuarterNum = quarterNum[q];
    const currentQuarterNum = quarterNum[currentQuarter];
    
    // Disable if:
    // 1. Year is in the past compared to current year, OR
    // 2. Same year but quarter is in the past compared to current quarter
    if (parseInt(year) < currentYear) {
      return true; // Past year
    }
    
    if (parseInt(year) === currentYear && selectedQuarterNum < currentQuarterNum) {
      return true; // Past quarter in current year
    }
    
    // 3. Quarter already exists in database
    if (existingQuarters[q]) {
      return true;
    }
    
    return false;
  };

  const handleYearSelect = (selectedYear) => {
    setYear(selectedYear);
    setShowYearDropdown(false);
  };

    const handleYearButtonPress = (event) => {
      if (isEditing) return;
      event.target.measure((fx, fy, width, height, px, py) => {
        setDropdownPosition({ x: px, y: py + height + 5, width });
        setShowYearDropdown(true);
      });
    };

  const handleRewardChange = (key, field, value) => {
    setRewards(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage);
        return;
      }
      const uri = response.assets?.[0]?.uri;
      if (uri) setImageUri(uri);
    });
  };

  const handleSubmit = async () => {
    if (!year || !quarter || !title || !description || !goal || !imageUri) {
      return Alert.alert('Error', 'Please fill all required fields.');
    }

    // Double-check if quarter is disabled
    if (isQuarterDisabled(quarter) && !isEditing) {
      return Alert.alert('Error', 'This quarter is not available for creation.');
    }

    setLoading(true);
    try {
      let uploadedImageUrl = imageUri;
      if (!imageUri.startsWith('http')) {
        uploadedImageUrl = await uploadImageToCloudinary(imageUri);
      }

      const payload = {
        yearQuarter: `${year}-${quarter}`,
        title,
        description,
        goal: parseInt(goal, 10),
        rewards,
        image: uploadedImageUrl,
      };

      if (isEditing) {
        await updateCommunityProgress(originalYearQuarter, payload);
        Alert.alert('Success', 'Community progress updated successfully!', [
          { text: 'OK', onPress: () => {
            if (route.params?.onSaved) route.params.onSaved();
            navigation.goBack();
          }},
        ]);
      } else {
        await addCommunityProgress(payload);
        Alert.alert('Success', 'Community progress added successfully!', [
          { text: 'OK', onPress: () => {
            if (route.params?.onSaved) route.params.onSaved();
            navigation.goBack();
          }},
        ]);
      }
    } catch (error) {
      console.error('Error saving community progress:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} community progress.`);
    } finally {
      setLoading(false);
    }
  };

  const getRankLabel = (key) => {
    switch(key) {
      case 'top1': return 'Top 1';
      case 'top2': return 'Top 2';
      case 'top3': return 'Top 3';
      case 'top4to10': return 'Top 4-10';
      case 'top11plus': return 'Top 11+';
      default: return key;
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          {isEditing ? 'Edit Community Progress' : 'Add Community Progress'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/icons/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40, paddingTop: 90 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flex: 0.58, marginRight: 10 }}>
            <Text style={styles.label}>Year</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={handleYearButtonPress}
              disabled={isEditing}
            >
              <Text style={styles.dropdownButtonText}>{year}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Quarter</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {quarters.map(q => {
                const disabled = isQuarterDisabled(q);
                return (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.quarterButton, 
                      quarter === q && styles.quarterSelected,
                      disabled && styles.quarterDisabled,
                      { marginRight: 6, marginBottom: 6 }
                    ]}
                    onPress={() => !disabled && setQuarter(q)}
                    disabled={disabled}
                  >
                    <Text style={[
                      quarter === q ? styles.quarterTextSelected : styles.quarterText,
                      disabled && styles.quarterTextDisabled
                    ]}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput 
          style={styles.input} 
          value={title} 
          onChangeText={setTitle} 
          placeholder="Progress title" 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={[styles.input, { height: 100 }]} 
          value={description} 
          onChangeText={setDescription} 
          multiline
          placeholder="Describe the community goal"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Goal</Text>
        <TextInput 
          style={styles.input} 
          value={goal} 
          onChangeText={setGoal} 
          keyboardType="numeric" 
          placeholder="Enter goal" 
          placeholderTextColor="#888" 
        />

        <Text style={styles.label}>Image</Text>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>
            {imageUri ? 'Change Image' : 'Upload Image'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Rewards</Text>
        <View style={styles.rewardHeaderRow}>
          <Text style={[styles.rewardLabel, { flex: 1 }]}></Text>
          <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>TerraCoins</Text>
          <Text style={[styles.rewardLabel, { flex: 1, textAlign: "center" }]}>TerraPoints</Text>
        </View>

        {rankOptions.map(rankKey => (
          <View key={rankKey} style={styles.rewardRow}>
            <Text style={styles.rewardLabel}>{getRankLabel(rankKey)}</Text>
            <TextInput
              style={[styles.rewardInput, { flex: 1, textAlign: "center" }]}
              keyboardType="numeric"
              value={String(rewards[rankKey]?.terraCoins || '')}
              onChangeText={(text) => handleRewardChange(rankKey, 'terraCoins', text)}
            />
            <TextInput
              style={[styles.rewardInput, { flex: 1, textAlign: "center" }]}
              keyboardType="numeric"
              value={String(rewards[rankKey]?.terraPoints || '')}
              onChangeText={(text) => handleRewardChange(rankKey, 'terraPoints', text)}
            />
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.submitButton, loading && { opacity: 0.6 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Year Dropdown Modal */}
      <Modal
        visible={showYearDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { 
            position: 'absolute',
            top: dropdownPosition.y,
            left: dropdownPosition.x,
            width: dropdownPosition.width || 100
          }]}>
            <ScrollView 
              style={styles.dropdownScroll}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {years.map(y => (
                <TouchableOpacity
                  key={y}
                  style={[
                    styles.option,
                    year === y && styles.optionSelected
                  ]}
                  onPress={() => handleYearSelect(y)}
                >
                  <Text style={[
                    styles.optionText,
                    year === y && styles.optionTextSelected
                  ]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerText: { fontSize: 20, fontWeight: '700', color: '#709775' },
  backIcon: { width: 40, height: 40, resizeMode: 'contain' },

  label: { color: '#CCCCCC', marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 10 },

  // Year Dropdown Styles - UPDATED TO MATCH CHART COMPONENT
  dropdownButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  dropdownButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },

  // Modal Styles - UPDATED TO MATCH CHART COMPONENT
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  optionSelected: {
    backgroundColor: '#709775',
  },
  optionText: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#fff',
  },

  // Quarter Styles
  quarterButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#CCCCCC' },
  quarterSelected: { backgroundColor: '#415D43' },
  quarterDisabled: { 
    backgroundColor: '#2A2A2A', 
    borderColor: '#666666',
    opacity: 0.6,
  },
  quarterText: { color: '#CCCCCC', fontWeight: '600' },
  quarterTextSelected: { color: '#fff', fontWeight: '700' },
  quarterTextDisabled: { color: '#666666' },

  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#CCCCCC', marginBottom: 12, marginTop: 20 },

  rewardHeaderRow: { flexDirection: 'row', marginBottom: 5 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rewardLabel: { flex: 1, color: '#CCCCCC', fontWeight: '600' },
  rewardInput: { flex: 1, backgroundColor: '#222', color: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginLeft: 8 },

  submitButton: { backgroundColor: '#709775', paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  uploadButton: { backgroundColor: '#709775', paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginBottom: 16 },
  uploadButtonText: { color: '#fff', fontWeight: '600' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
});

export default AddCommunityProgress;