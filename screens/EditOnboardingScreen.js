import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import { onboardingQuestions } from '../services/onboardingService';
import OptionButton from '../components/OptionButton';
import ProgressIndicator from '../components/ProgressIndicator';
import { saveOnboardingPreferences } from '../repositories/onboardingRepository';
import { useAuth } from '../context/AuthContext';
import firestore from '@react-native-firebase/firestore';
import ConfirmationPopup from '../components/ConfirmationPopup';
import HeaderRow from '../components/HeaderRow';

const EditOnboardingScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const MULTI_SELECT_QUESTIONS = [0, 2, 3];
  const isMultiSelect = MULTI_SELECT_QUESTIONS.includes(currentStep);
  const currentAnswer = answers[currentStep] || (isMultiSelect ? [] : null);
  useEffect(() => {
    const loadExistingPreferences = async () => {
      try {
        if (user) {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const existingAnswers = {};
            if (userData.transportationOptions) existingAnswers[0] = userData.transportationOptions;
            if (userData.commuteDistance) existingAnswers[1] = userData.commuteDistance;
            if (userData.energyControl) existingAnswers[2] = userData.energyControl;
            if (userData.dietType) existingAnswers[3] = userData.dietType;
            if (userData.budgetLevel) existingAnswers[4] = userData.budgetLevel;
            
            setAnswers(existingAnswers);
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setErrorMessage('Failed to load your existing preferences.');
        setShowErrorPopup(true);
      } finally {
        setLoading(false);
      }
    };

    loadExistingPreferences();
  }, [user]);

  const handleOptionSelect = (option) => {
    if (isMultiSelect) {
      setAnswers(prev => ({
        ...prev,
        [currentStep]: currentAnswer.includes(option)
          ? currentAnswer.filter(item => item !== option)
          : [...currentAnswer, option]
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [currentStep]: currentAnswer === option ? null : option
      }));
    }
  };

  const formatAnswersForFirestore = () => ({
    transportationOptions: answers[0] || [],
    commuteDistance: answers[1] || null,
    energyControl: answers[2] || [],
    dietType: answers[3] || [],
    budgetLevel: answers[4] || null
  });

  const handleSavePreferences = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const preferences = formatAnswersForFirestore();
      await saveOnboardingPreferences(preferences);
      
      setShowSaveConfirmation(true);
    } catch (error) {
      console.error('Save error:', error);
      setErrorMessage(error.message || 'Failed to save preferences. Please try again.');
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSave = () => {
    setShowSaveConfirmation(false);
    navigation.goBack();
  };

  const handleNext = () => {
    if ((isMultiSelect && currentAnswer.length === 0) ||
      (!isMultiSelect && !currentAnswer)) {
      setErrorMessage('Please select at least one option');
      setShowErrorPopup(true);
      return;
    }

    if (currentStep === onboardingQuestions.length - 1) {
      handleSavePreferences();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleStepPress = (stepIndex) => {
    if (stepIndex <= currentStep || answers[stepIndex]) {
      setCurrentStep(stepIndex);
    }
  };

  const isOptionSelected = (option) => {
    return isMultiSelect
      ? currentAnswer.includes(option)
      : currentAnswer === option;
  };

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderRow 
        title="Edit Preferences" 
        onBackPress={handleBack} 
      />

      <View style={styles.content}>
        <Text style={styles.title}>{onboardingQuestions[currentStep].title}</Text>
        <Text style={styles.subtitle}>{onboardingQuestions[currentStep].question}</Text>

        <View style={styles.optionsContainer}>
          {onboardingQuestions[currentStep].options.map((option) => (
            <OptionButton
              key={option}
              label={option}
              isSelected={isOptionSelected(option)}
              onPress={() => handleOptionSelect(option)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {currentStep === onboardingQuestions.length - 1 ? 'Save Changes' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={onboardingQuestions.length}
        onStepPress={handleStepPress}
        answers={answers}
      />

      <ConfirmationPopup
        visible={showErrorPopup}
        title="Error"
        message={errorMessage}
        confirmText="OK"
        type="error"
        onConfirm={() => setShowErrorPopup(false)}
        showCancel={false}
      />

      <ConfirmationPopup
        visible={showSaveConfirmation}
        onConfirm={handleConfirmSave}
        title="Preferences Updated"
        message="Your preferences have been successfully updated!"
        confirmText="OK"
        showCancel={false}
        type="success"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    paddingHorizontal: scale(20),
    paddingBottom: vScale(40),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'DMSans-Bold',
    fontSize: scale(22),
    color: '#709775',
    textAlign: 'center',
    marginBottom: vScale(20),
  },
  subtitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: scale(13),
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: vScale(40),
    lineHeight: vScale(20),
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: vScale(20),
  },
  button: {
    width: scale(308),
    height: vScale(53),
    backgroundColor: '#415D43',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vScale(30),
  },
  buttonText: {
    color: 'white',
    fontSize: scale(14),
    fontWeight: 'bold',
  },
});

export default EditOnboardingScreen;