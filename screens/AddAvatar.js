import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Image, ScrollView, Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { avatarsRepository } from '../repositories/avatarsRepository';
import { uploadImageToCloudinary } from '../services/cloudinary';
import auth from '@react-native-firebase/auth';

const AddAvatar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingAvatar = route.params?.avatar;
  const onSaved = route.params?.onSaved;

  const [name, setName] = useState(existingAvatar?.name || '');
  const [description, setDescription] = useState(existingAvatar?.description || '');
  const [type, setType] = useState(existingAvatar?.type || 'free');
  const [terracoin, setTerracoin] = useState(existingAvatar?.terracoin || '');
  const [imageUri, setImageUri] = useState(existingAvatar?.imageurl || null);
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
    if (!name.trim() || !description.trim() || !imageUri) {
      return Alert.alert('Missing Fields', 'Please fill all fields and upload an image.');
    }
    if (type === 'paid' && (!terracoin || isNaN(terracoin))) {
      return Alert.alert('Invalid Terracoin', 'Please enter a valid Terracoin amount.');
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
        type,
        terracoin: type === 'paid' ? Number(terracoin) : 0,
        imageurl: finalImageUrl,
        createdAt: new Date(),
      };

      if (existingAvatar?.id) {
        await avatarsRepository.updateAvatar(existingAvatar.id, payload);
        Alert.alert('Updated', 'Avatar updated successfully');
      } else {
        await avatarsRepository.addAvatar(payload);
        Alert.alert('Saved', 'Avatar added successfully');
      }

      if (onSaved) onSaved();
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save avatar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Add Avatar</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../assets/icons/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={styles.label}>Avatar Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Avatar Name"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Avatar Description"
          placeholderTextColor="#888"
          multiline
        />

        <Text style={styles.label}>Avatar Image</Text>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>Upload Image</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Type</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
          <Text style={styles.dropdownButtonText}>{type.toUpperCase()}</Text>
        </TouchableOpacity>
        {dropdownOpen &&
          ['free', 'paid'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.option}
              onPress={() => { setType(opt); setDropdownOpen(false); }}
            >
              <Text style={{ color: type === opt ? '#fff' : '#ccc' }}>
                {type === opt ? '✓ ' : ''}{opt.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}

        {type === 'paid' && (
          <>
            <Text style={styles.label}>Terracoin Cost</Text>
            <TextInput
              style={styles.input}
              value={terracoin.toString()}
              onChangeText={setTerracoin}
              placeholder="Amount"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
          </>
        )}
      </ScrollView>

      <View style={styles.saveContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.submitButtonText}>
            {saving ? 'Saving...' : existingAvatar ? 'Update Avatar' : 'Save Avatar'}
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

export default AddAvatar;
