// screens/AddTask.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { tasksRepository } from '../repositories/tasksRepository';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { onboardingQuestions } from '../services/onboardingService';
import auth from '@react-native-firebase/auth';

const AddTask = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const onSaved = route.params?.onSaved;
  const existingTask = route.params?.task;

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [difficulty, setDifficulty] = useState(existingTask?.difficulty || 'easy');
  const [transport, setTransport] = useState(Array.isArray(existingTask?.requirements?.transport) ? existingTask.requirements.transport : []);
  const [energy, setEnergy] = useState(Array.isArray(existingTask?.requirements?.energy) ? existingTask.requirements.energy : []);
  const [diet, setDiet] = useState(Array.isArray(existingTask?.requirements?.diet) ? existingTask.requirements.diet : []);
  const [budget, setBudget] = useState(Array.isArray(existingTask?.requirements?.budget) ? existingTask.requirements.budget : []);
  const [imageUri, setImageUri] = useState(existingTask?.imageurl || null);
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({});

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

  const toggleOption = (field, option) => {
    let current;
    let setter;
    switch (field) {
      case 'transport': current = transport; setter = setTransport; break;
      case 'energy': current = energy; setter = setEnergy; break;
      case 'diet': current = diet; setter = setDiet; break;
      case 'budget': current = budget; setter = setBudget; break;
      default: return;
    }
    if (current.includes(option)) setter(current.filter(o => o !== option));
    else setter([...current, option]);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Fields', 'Please fill title and description.');
      return;
    }
    if (budget.length === 0) {
      Alert.alert('Budget Required', 'Please select at least one budget option.');
      return;
    }
    setSaving(true);
    try {
      let finalImageUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        finalImageUrl = await uploadImageToCloudinary(imageUri);
      }
      const currentUser = auth().currentUser;
      const finalRequirements = { transport, energy, diet, budget };
      const payload = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        imageurl: finalImageUrl,
        createdby: currentUser?.email || 'unknown',
        requirements: finalRequirements,
      };
      if (existingTask?.id) {
        await tasksRepository.updateTask(existingTask.id, payload);
        Alert.alert('Updated', 'Task updated successfully');
      } else {
        await tasksRepository.addTask(payload);
        Alert.alert('Saved', 'Task added successfully');
      }
      if (onSaved) onSaved();
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const questionMapping = [
    { field: 'transport', questions: [onboardingQuestions[0], onboardingQuestions[1]] },
    { field: 'energy', questions: [onboardingQuestions[2]] },
    { field: 'diet', questions: [onboardingQuestions[3]] },
    { field: 'budget', questions: [onboardingQuestions[4]] },
  ];

  const openDropdown = (key) => setDropdownOpen({ [key]: true });

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          {existingTask ? 'Edit Task' : 'Add Task'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/icons/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, paddingTop: 80 }}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Task description"
          placeholderTextColor="#888"
          multiline
        />

        <Text style={styles.label}>Task Image</Text>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>Upload Image</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Difficulty</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => openDropdown('difficulty')}>
          <Text style={styles.dropdownButtonText}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Text>
        </TouchableOpacity>
        {dropdownOpen.difficulty &&
          ['easy', 'hard'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.option}
              onPress={() => { setDifficulty(opt); setDropdownOpen({}); }}
            >
              <Text style={{ color: difficulty === opt ? '#fff' : '#ccc' }}>
                {difficulty === opt ? '✓ ' : ''}{opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}

        {questionMapping.map((group) => {
          const selected =
                group.field === 'transport' ? (Array.isArray(transport) ? transport : [])
              : group.field === 'energy' ? (Array.isArray(energy) ? energy : [])
              : group.field === 'diet' ? (Array.isArray(diet) ? diet : [])
              : Array.isArray(budget) ? budget : [];

          const allOptions = group.questions.flatMap(q => q.options);

          return (
            <View key={group.field} style={{ marginBottom: 16 }}>
              <Text style={styles.label}>{group.field.charAt(0).toUpperCase() + group.field.slice(1)}</Text>
              <View style={styles.tagsContainer}>
                {selected.map(opt => (
                  <View key={opt} style={styles.tag}>
                    <Text style={styles.tagText}>{opt}</Text>
                    <TouchableOpacity onPress={() => toggleOption(group.field, opt)}>
                      <Text style={styles.removeTag}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.dropdownButton} onPress={() => openDropdown(group.field)}>
                <Text style={styles.dropdownButtonText}>Select Options</Text>
              </TouchableOpacity>
              {dropdownOpen[group.field] &&
                allOptions.map(opt => (
                  <TouchableOpacity key={opt} style={styles.option} onPress={() => toggleOption(group.field, opt)}>
                    <Text style={{ color: selected.includes(opt) ? '#fff' : '#ccc' }}>
                      {selected.includes(opt) ? '✓ ' : ''}{opt}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          );
        })}

        <TouchableOpacity style={styles.submitButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.submitButtonText}>{saving ? 'Saving...' : existingTask ? 'Update Task' : 'Save Task'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#131313',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerText: { fontSize: 20, fontWeight: '700', color: '#709775' },
  backIcon: { width: 40, height: 40, resizeMode: 'contain' },

  label: { color: '#fff', marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 10 },
  dropdownButton: { backgroundColor: '#1E1E1E', padding: 12, borderRadius: 12, marginBottom: 6 },
  dropdownButtonText: { color: '#fff' },
  option: { padding: 12, backgroundColor: '#1E1E1E', borderRadius: 12, marginVertical: 2 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  tag: { flexDirection: 'row', backgroundColor: '#415D43', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginRight: 6, marginBottom: 6, alignItems: 'center' },
  tagText: { color: '#fff', marginRight: 6 },
  removeTag: { color: '#fff', fontWeight: '700', fontSize: 16 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
  uploadButton: { backgroundColor: '#709775', paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginBottom: 16 },
  uploadButtonText: { color: '#fff', fontWeight: '600' },
  submitButton: { backgroundColor: '#709775', paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginBottom: 40 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AddTask;
