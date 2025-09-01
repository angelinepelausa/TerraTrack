import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, Dimensions 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { taskVerificationService } from '../services/taskVerificationService';
import { scale, vScale } from '../utils/scaling';

const { width, height } = Dimensions.get('window');

const VerifyTaskScreen = ({ route, navigation }) => {
  const { task, onVerificationComplete } = route.params;
  const { user } = useAuth();
  const [verificationResult, setVerificationResult] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerification = async (result) => {
    const validation = taskVerificationService.validateVerification(task, result, rejectionNotes);
    if (!validation.isValid) {
      Alert.alert("Validation Error", validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const verificationResult = await taskVerificationService.processVerification(
        user.uid, task.userId, task.id, result, rejectionNotes
      );

      if (verificationResult.success) {
        Alert.alert(
          "Success", 
          `Task ${result === 'approved' ? 'approved' : 'rejected'} successfully!`,
          [
            { 
              text: "OK", 
              onPress: () => {
                onVerificationComplete?.();
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", verificationResult.error || "Failed to verify task");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Adjust image height dynamically based on whether rejection notes are visible
  const imageHeight = verificationResult === 'rejected' ? height * 0.35 : height * 0.45;

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Verify Task</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Image 
          source={{ uri: task.photoUrl }} 
          style={[styles.taskImage, { height: imageHeight }]} 
          resizeMode="contain"
        />
        <Text style={styles.taskTitle}>{task.title}</Text>

        <Text style={styles.sectionTitle}>Verification Decision</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.optionButton, verificationResult === 'approved' && styles.selectedApprove]}
            onPress={() => setVerificationResult('approved')}
            disabled={loading}
          >
            <Text style={styles.optionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, verificationResult === 'rejected' && styles.selectedReject]}
            onPress={() => setVerificationResult('rejected')}
            disabled={loading}
          >
            <Text style={styles.optionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>

        {verificationResult === 'rejected' && (
          <TextInput
            style={styles.notesInput}
            placeholder="Provide details for rejection..."
            placeholderTextColor="#AAAAAA"
            value={rejectionNotes}
            onChangeText={setRejectionNotes}
            multiline
            numberOfLines={3}
          />
        )}

        <TouchableOpacity
          style={[
            styles.submitButton, 
            (!verificationResult || (verificationResult === 'rejected' && !rejectionNotes.trim())) && styles.disabledButton
          ]}
          onPress={() => handleVerification(verificationResult)}
          disabled={!verificationResult || (verificationResult === 'rejected' && !rejectionNotes.trim()) || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Verification</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  header: {
    width: '100%',
    paddingVertical: vScale(25),
    backgroundColor: '#415D43',
    borderBottomLeftRadius: scale(20),
    borderBottomRightRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: scale(22),
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
  },
  taskImage: {
    width: '100%',
    borderRadius: scale(10),
    marginBottom: vScale(15),
  },
  taskTitle: {
    color: '#FFFFFF',
    fontSize: scale(20),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: vScale(20),
  },
  sectionTitle: {
    color: '#CCCCCC',
    fontSize: scale(14),
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: vScale(10),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: vScale(20),
  },
  optionButton: {
    flex: 1,
    paddingVertical: vScale(12),
    marginHorizontal: scale(5),
    borderRadius: scale(10),
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedApprove: {
    backgroundColor: '#1F7A3A', // darker green
    borderColor: '#1F7A3A',
  },
  selectedReject: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scale(14),
  },
  notesInput: {
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: scale(10),
    padding: scale(12),
    color: '#FFFFFF',
    textAlignVertical: 'top',
    fontSize: scale(14),
    marginBottom: vScale(15),
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#415D43',
    paddingVertical: vScale(14),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#444444',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: scale(16),
  },
});

export default VerifyTaskScreen;
