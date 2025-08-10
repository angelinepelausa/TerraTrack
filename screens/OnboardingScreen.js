import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import { onboardingQuestions, REFERRAL_STEP } from '../services/onboardingService';
import OptionButton from '../components/OptionButton';
import ProgressIndicator from '../components/ProgressIndicator';

const OnboardingScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [referralCode, setReferralCode] = useState('');
  
  const MULTI_SELECT_QUESTIONS = [0, 2, 3];
  const isReferralStep = currentStep === REFERRAL_STEP;
  const isMultiSelect = MULTI_SELECT_QUESTIONS.includes(currentStep);
  const currentAnswer = answers[currentStep] || (isMultiSelect ? [] : null);

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

  const handleNext = () => {
    if (isReferralStep) {
      navigation.replace('HomeScreen');
      return;
    }

    if ((isMultiSelect && currentAnswer.length === 0) || 
        (!isMultiSelect && !currentAnswer)) {
      Alert.alert('Error', 'Please select at least one option');
      return;
    }

    setCurrentStep(prev => prev + 1);
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isReferralStep ? (
          <>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleNext}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <View style={styles.centeredContent}>
              <Text style={[styles.title, { fontSize: scale(32), marginBottom: vScale(20) }]}>
                Referral Code
              </Text>
              <Text style={[styles.subtitle, { fontSize: scale(15), marginBottom: vScale(40), lineHeight: vScale(20) }]}>
                Enter a 6-character referral code if you have one
              </Text>

              <TextInput
                style={styles.referralInput}
                placeholder="ABCDEF"
                placeholderTextColor="#7A7A7A"
                maxLength={6}
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.button, { 
                  width: scale(308), 
                  height: vScale(53), 
                  marginTop: vScale(20) 
                }]}
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
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
              style={styles.button}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>
                {currentStep === onboardingQuestions.length - 1 ? 'Continue' : 'Next'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {!isReferralStep && (
        <ProgressIndicator 
          currentStep={currentStep} 
          totalSteps={onboardingQuestions.length} 
          onStepPress={handleStepPress} 
          answers={answers}
        />
      )}
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
  referralInput: {
    width: scale(200),
    height: vScale(50),
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: scale(15),
    color: '#FFFFFF',
    fontSize: scale(16),
    fontFamily: 'DMSans-Medium',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: vScale(40),
    borderWidth: 1,
    borderColor: '#709775',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  skipButton: {
    position: 'absolute',
    top: vScale(40),
    right: scale(20),
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  skipButtonText: {
    color: '#709775',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default OnboardingScreen;