import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, UIManager, Image
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { addCommunityProgress, updateCommunityProgress } from '../repositories/communityProgressRepository';
import { uploadImageToCloudinary } from '../services/cloudinary';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const rankOptions = ["top1", "top2", "top3", "top4to10", "top11plus"];

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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, paddingTop: 90 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flex: 0.58, marginRight: 10 }}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              placeholder="Enter year"
              placeholderTextColor="#888"
              editable={!isEditing}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Quarter</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {quarters.map(q => (
                <TouchableOpacity
                  key={q}
                  style={[styles.quarterButton, quarter === q && styles.quarterSelected, { marginRight: 6, marginBottom: 6 }]}
                  onPress={() => setQuarter(q)}
                  disabled={isEditing}
                >
                  <Text style={quarter === q ? styles.quarterTextSelected : styles.quarterText}>{q}</Text>
                </TouchableOpacity>
              ))}
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
          placeholder="Describe the progress"
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

  quarterButton: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#CCCCCC' },
  quarterSelected: { backgroundColor: '#415D43' },
  quarterText: { color: '#CCCCCC', fontWeight: '600' },
  quarterTextSelected: { color: '#fff', fontWeight: '700' },

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
