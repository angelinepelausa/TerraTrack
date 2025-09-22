// screens/AddWeeklyQuiz.js
import React, { useState, useEffect } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { weeklyQuizRepository } from '../repositories/weeklyQuizRepository';

const AddWeeklyQuiz = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingQuiz = route.params?.quiz; 

  const [title, setTitle] = useState(existingQuiz?.title || '');
  const [question, setQuestion] = useState(existingQuiz?.question || '');
  const [options, setOptions] = useState(existingQuiz?.options || ['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(existingQuiz?.correctIndex ?? null);
  const [imageUri, setImageUri] = useState(null);
  const [imageUrl, setImageUrl] = useState(existingQuiz?.imageUrl || '');
  const [date, setDate] = useState(existingQuiz ? new Date(existingQuiz.id) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!title.trim() || !question.trim() || options.some(opt => !opt.trim())) {
      Alert.alert('Missing fields', 'Please fill all fields.');
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

      const docId = date.toISOString().split('T')[0];

      const allQuizzes = await weeklyQuizRepository.getAllQuizzes();

      const selectedWeekStart = new Date(date);
      selectedWeekStart.setDate(date.getDate() - date.getDay() + 1); 
      selectedWeekStart.setHours(0, 0, 0, 0);
      const selectedWeekEnd = new Date(selectedWeekStart);
      selectedWeekEnd.setDate(selectedWeekStart.getDate() + 6); 
      selectedWeekEnd.setHours(23, 59, 59, 999);

      const duplicate = allQuizzes.find(q => {
        const qDate = new Date(q.id); 
        return (
          qDate >= selectedWeekStart &&
          qDate <= selectedWeekEnd &&
          q.id !== existingQuiz?.id
        );
      });

      if (duplicate) {
        Alert.alert(
          'Duplicate Week',
          'A quiz for this week already exists. Please choose a different date.'
        );
        setSaving(false);
        return;
      }

      const dayOfWeek = date.getDay();
      const daysUntilSunday = 7 - dayOfWeek;
      const expiresAt = new Date(date);
      expiresAt.setDate(expiresAt.getDate() + daysUntilSunday);
      expiresAt.setHours(23, 59, 59, 999);

      const payload = {
        title: title.trim(),
        question: question.trim(),
        options: options.map(opt => opt.trim()),
        correctIndex: correctIndex !== null ? parseInt(correctIndex, 10) : 0,
        imageUrl: finalImageUrl,
        createdAt: existingQuiz?.createdAt || new Date(),
        expiresAt,
      };

      await firestore()
        .collection('weekly_quizzes')
        .doc(docId)
        .set(payload);

      Alert.alert('Saved', 'Weekly quiz saved successfully');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          {existingQuiz ? 'Edit Weekly Quiz' : 'Add Weekly Quiz'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/icons/back.png')} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 16, paddingBottom: 40 }}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Question</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Enter question"
          placeholderTextColor="#888"
          value={question}
          onChangeText={setQuestion}
          multiline
        />

        <Text style={styles.label}>Options</Text>
        {options.map((opt, idx) => (
          <TextInput
            key={idx}
            style={styles.input}
            placeholder={`Option ${idx + 1}`}
            placeholderTextColor="#888"
            value={opt}
            onChangeText={(text) => {
              const newOptions = [...options];
              newOptions[idx] = text;
              setOptions(newOptions);
            }}
          />
        ))}

        <Text style={styles.label}>Correct Answer</Text>
        <TextInput
          style={styles.input}
          placeholder="Correct option index"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={correctIndex !== null ? String(correctIndex) : ''}
          onChangeText={(v) => setCorrectIndex(v)}
        />

        <Text style={styles.label}>Image</Text>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.previewImage} />
        ) : null}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Quiz Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
          <Text style={{ color: '#fff' }}>{date.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitButtonText}>
            {saving ? 'Saving...' : 'Save Weekly Quiz'}
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
  input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 10 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
  uploadButton: { backgroundColor: '#709775', paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginBottom: 16 },
  uploadButtonText: { color: '#fff', fontWeight: '600' },
  submitButton: { backgroundColor: '#709775', paddingVertical: 14, borderRadius: 25, alignItems: 'center', marginBottom: 40 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default AddWeeklyQuiz;
