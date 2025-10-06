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
import HeaderRow from '../components/HeaderRow';

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
      {/* Fixed Header using HeaderRow component */}
      <View style={styles.headerWrapper}>
        <HeaderRow
          title={existingTask ? 'Edit Task' : 'Add Task'}
          onBackPress={() => navigation.goBack()}
        />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          style={[styles.input, styles.textArea]}
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
            <View key={group.field} style={styles.optionGroup}>
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
          <Text style={styles.submitButtonText}>
            {saving ? 'Saving...' : existingTask ? 'Update Task' : 'Save Task'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#131313',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: { 
    padding: 16,
  },
  headerWrapper: {
  paddingHorizontal: 16,
  paddingTop: 30,
  marginBottom: -20,
  },
  label: { 
    color: '#fff', 
    marginTop: 16, 
    marginBottom: 8, 
    fontWeight: '600',
    fontSize: 16,
  },
  input: { 
    backgroundColor: '#1E1E1E', 
    color: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    fontSize: 16, 
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownButton: { 
    backgroundColor: '#1E1E1E', 
    padding: 12, 
    borderRadius: 12, 
    marginTop: 8,
  },
  dropdownButtonText: { 
    color: '#fff',
    fontSize: 16,
  },
  option: { 
    padding: 12, 
    backgroundColor: '#1E1E1E', 
    borderRadius: 12, 
    marginTop: 4,
  },
  optionGroup: {
    marginBottom: 8,
  },
  tagsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginVertical: 8,
  },
  tag: { 
    flexDirection: 'row', 
    backgroundColor: '#415D43', 
    paddingHorizontal: 12,
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 8, 
    marginBottom: 8, 
    alignItems: 'center' 
  },
  tagText: { 
    color: '#fff', 
    marginRight: 6,
    fontSize: 14,
  },
  removeTag: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 16,
  },
  previewImage: { 
    width: '100%', 
    height: 200, 
    borderRadius: 12, 
    marginTop: 8,
    marginBottom: 12,
  },
  uploadButton: { 
    backgroundColor: '#709775', 
    paddingVertical: 14, 
    borderRadius: 25, 
    alignItems: 'center', 
    marginTop: 8,
  },
  uploadButtonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: { 
    backgroundColor: '#709775', 
    paddingVertical: 16, 
    borderRadius: 25, 
    alignItems: 'center', 
    marginTop: 24,
    marginBottom: 24,
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700' 
  },
});

export default AddTask;