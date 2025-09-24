// screens/AddBadge.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { badgesRepository } from '../repositories/badgesRepository';
import { uploadImageToCloudinary } from '../services/cloudinary';

const badgeCategories = [
  'Educational Materials',
  'Weekly Quiz',
  'Tasks',
  'Leaderboard',
  'Tasks Verified',
  'Referral',
];

const AddBadge = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingBadge = route.params?.badge;
  const onSaved = route.params?.onSaved;

  const [name, setName] = useState(existingBadge?.name || '');
  const [description, setDescription] = useState(existingBadge?.description || '');
  const [category, setCategory] = useState(existingBadge?.category || badgeCategories[0]);
  const [targetNumber, setTargetNumber] = useState(existingBadge?.targetNumber?.toString() || '');
  const [imageUri, setImageUri] = useState(existingBadge?.imageurl || null);
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) return Alert.alert('Error', response.errorMessage);
      const uri = response.assets?.[0]?.uri;
      if (uri) setImageUri(uri);
    });
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !imageUri || !targetNumber) {
      return Alert.alert('Missing Fields', 'Please fill all fields, select category and upload an image.');
    }

    if (isNaN(targetNumber)) {
      return Alert.alert('Invalid Number', 'Please enter a valid number for the target.');
    }

    setSaving(true);
    try {
      let finalImageUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        finalImageUrl = await uploadImageToCloudinary(imageUri);
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        targetNumber: Number(targetNumber),
        imageurl: finalImageUrl,
        createdAt: new Date(),
      };

      if (existingBadge?.id) {
        await badgesRepository.updateBadge(existingBadge.id, payload);
        Alert.alert('Updated', 'Badge updated successfully');
      } else {
        await badgesRepository.addBadge(payload);
        Alert.alert('Saved', 'Badge added successfully');
      }

      if (onSaved) onSaved();
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save badge.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Add Badge</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../assets/icons/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={styles.label}>Badge Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Badge Name"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Badge Description"
          placeholderTextColor="#888"
          multiline
        />

        <Text style={styles.label}>Badge Image</Text>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>Upload Image</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Category</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
          <Text style={styles.dropdownButtonText}>{category}</Text>
        </TouchableOpacity>
        {dropdownOpen && badgeCategories.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={styles.option}
            onPress={() => { setCategory(opt); setDropdownOpen(false); }}
          >
            <Text style={{ color: category === opt ? '#fff' : '#ccc' }}>
              {category === opt ? '✓ ' : ''}{opt}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Target Number</Text>
        <TextInput
          style={styles.input}
          value={targetNumber}
          onChangeText={setTargetNumber}
          placeholder="Enter number"
          placeholderTextColor="#888"
          keyboardType="numeric"
        />
      </ScrollView>

      <View style={styles.saveContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.submitButtonText}>
            {saving ? 'Saving...' : existingBadge ? 'Update Badge' : 'Save Badge'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313', paddingTop: 40 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  backIcon: { width: 40, height: 40, resizeMode: "contain", tintColor: "#709775" },
  headerText: { fontSize: 22, fontWeight: "bold", color: "#709775" },

  label: { color: '#fff', marginTop: 12, marginBottom: 6, fontWeight: '600', paddingHorizontal: 16 },
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 10, marginHorizontal: 16 },
  previewImage: { width: '90%', height: 200, borderRadius: 12, marginBottom: 10, alignSelf: 'center' },
  uploadButton: { backgroundColor: '#709775', paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginBottom: 16, marginHorizontal: 16 },
  uploadButtonText: { color: '#fff', fontWeight: '600' },

  dropdownButton: { backgroundColor: '#1E1E1E', padding: 12, borderRadius: 12, marginBottom: 6, marginHorizontal: 16 },
  dropdownButtonText: { color: '#fff' },
  option: { padding: 12, backgroundColor: '#1E1E1E', borderRadius: 12, marginVertical: 2, marginHorizontal: 16 },

  saveContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#131313' },
  submitButton: { backgroundColor: '#415D43', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AddBadge;
