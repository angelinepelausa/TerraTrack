// screens/AddEducationalMaterial.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { educationalContentRepository } from '../repositories/educationalContentRepository';

const AddEducationalMaterial = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingContent = route.params?.content;

  const [title, setTitle] = useState(existingContent?.title || '');
  const [bodyContent, setBodyContent] = useState(existingContent?.content || '');
  const [description, setDescription] = useState(existingContent?.description || '');
  const [imageUri, setImageUri] = useState(null);
  const [imageUrl, setImageUrl] = useState(existingContent?.imageUrl || '');
  const [quiz, setQuiz] = useState(
    existingContent?.quiz?.questions || [
      { text: '', options: ['', '', '', ''], correctIndex: null },
    ]
  );
  const [saving, setSaving] = useState(false);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.error('ImagePicker error:', response.errorMessage);
        Alert.alert('Error', 'Unable to pick image.');
        return;
      }
      const uri = response.assets?.[0]?.uri;
      if (uri) setImageUri(uri);
    });
  };

  const handleAddQuestion = () =>
    setQuiz([...quiz, { text: '', options: ['', '', '', ''], correctIndex: null }]);

  const handleDeleteQuestion = (index) => {
    if (index === 0) {
      Alert.alert('Not allowed', 'You cannot delete the first question.');
      return;
    }
    const updated = quiz.filter((_, i) => i !== index);
    setQuiz(updated);
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const updated = [...quiz];
    if (field === 'text') updated[qIndex].text = value;
    else if (field.startsWith('option')) {
      const optionIndex = parseInt(field.split('-')[1], 10);
      updated[qIndex].options[optionIndex] = value;
    } else if (field === 'correctIndex') {
      updated[qIndex].correctIndex = value === '' ? null : parseInt(value, 10);
    }
    setQuiz(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !bodyContent.trim() || !description.trim()) {
      Alert.alert('Missing fields', 'Please fill in title, content and description.');
      return;
    }
    if (!imageUri && !imageUrl) {
      Alert.alert('Missing image', 'Please choose an image.');
      return;
    }

    setSaving(true);

    try {
      let finalImageUrl = imageUrl;
      if (imageUri) {
        finalImageUrl = await uploadImageToCloudinary(imageUri);
        if (!finalImageUrl) throw new Error('Image upload failed');
        setImageUrl(finalImageUrl);
      }

      const payload = {
        title: title.trim(),
        content: bodyContent.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        quiz: { questions: quiz },
        lastUpdated: new Date(),
        publishedAt: existingContent?.publishedAt || new Date(),
      };

      if (existingContent?.id) {
        await educationalContentRepository.updateContent(existingContent.id, payload);
      } else {
        await educationalContentRepository.addContent(payload);
      }
      Alert.alert('Saved', 'Educational content saved successfully');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          {existingContent ? 'Edit Educational Material' : 'Add Educational Material'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/icons/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 80, paddingHorizontal: 16 }}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Content</Text>
        <TextInput
          style={[styles.input, { height: 140 }]}
          placeholder="Enter content"
          placeholderTextColor="#888"
          value={bodyContent}
          onChangeText={setBodyContent}
          multiline
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Enter description"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Image</Text>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.previewImage} />
        ) : null}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Quiz Questions</Text>
        {quiz.map((q, idx) => (
          <View key={idx} style={styles.quizCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.quizLabel}>Question {idx + 1}</Text>
              {idx !== 0 && (
                <TouchableOpacity onPress={() => handleDeleteQuestion(idx)}>
                  <Text style={{ color: 'red', fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Question text"
              placeholderTextColor="#888"
              value={q.text}
              onChangeText={(t) => handleQuestionChange(idx, 'text', t)}
            />
            {q.options.map((opt, oi) => (
              <TextInput
                key={oi}
                style={styles.input}
                placeholder={`Option ${oi + 1}`}
                placeholderTextColor="#888"
                value={opt}
                onChangeText={(t) => handleQuestionChange(idx, `option-${oi}`, t)}
              />
            ))}
            <TextInput
              style={styles.input}
              placeholder="Correct option index"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={q.correctIndex !== null ? String(q.correctIndex) : ''}
              onChangeText={(v) => handleQuestionChange(idx, 'correctIndex', v)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addQuestionButton} onPress={handleAddQuestion}>
          <Text style={styles.addQuestionButtonText}>+ Add Another Question</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitButtonText}>
            {saving ? 'Saving...' : 'Save Educational Content'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#131313' },

  /* Fixed Header */
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
  input: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#709775',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 5,
    marginHorizontal: 6,
  },
  uploadButtonText: { color: '#fff', fontWeight: '600' },
  quizCard: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  quizLabel: { color: '#fff', fontWeight: '600', marginBottom: 8 },
  addQuestionButton: {
    alignItems: 'center',
    marginVertical: 16,
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#709775',
  },
  addQuestionButtonText: { color: '#709775', fontWeight: '600' },
  submitButton: {
    backgroundColor: '#709775',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AddEducationalMaterial;
