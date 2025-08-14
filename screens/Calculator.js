import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import OptionButton from '../components/OptionButton';
import ProgressIndicator from '../components/ProgressIndicator';
import { calculatorBaseQuestions } from '../services/calculatorService';
import { saveCarbonFootprint } from '../repositories/calculatorRepository';

const Calculator = ({ navigation }) => {
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build dynamic steps array
  const steps = useMemo(() => {
    let baseSteps = [];
    calculatorBaseQuestions.forEach(q => {
      baseSteps.push(q);

      // If the user answered this and it's multi-select with follow-ups
      if (answers[q.id] && q.type === 'multi' && q.followUps) {
        answers[q.id].forEach(selected => {
          q.followUps.forEach(fu => {
            baseSteps.push({
              id: `${fu.id}_${selected}`,
              title: typeof fu.title === 'function' ? fu.title(selected) : fu.title,
              question: null,
              type: fu.type,
              options: fu.options || []
            });
          });
        });
      }
    });
    return baseSteps;
  }, [answers]);

  const currentQuestion = steps[currentStep];

  const isMultiSelect = currentQuestion?.type === 'multi';
  const isInput = currentQuestion?.type === 'input';
  const currentAnswer = answers[currentQuestion?.id] || (isMultiSelect ? [] : null);

  const handleOptionSelect = (option) => {
    if (isMultiSelect) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer.includes(option)
          ? currentAnswer.filter(item => item !== option)
          : [...currentAnswer, option]
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer === option ? null : option
      }));
    }
  };

  const handleInputChange = (text) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: text
    }));
  };

  const handleNext = () => {
    if (isMultiSelect && currentAnswer.length === 0) {
      Alert.alert('Error', 'Please select at least one option');
      return;
    }
    if (!isMultiSelect && !isInput && !currentAnswer) {
      Alert.alert('Error', 'Please select an option');
      return;
    }
    if (isInput && (!currentAnswer || currentAnswer.trim() === '')) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    if (currentStep === steps.length - 1) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepPress = (index) => {
    if (index <= currentStep) {
      setCurrentStep(index);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const results = await saveCarbonFootprint(answers);
      Alert.alert(
        'Calculation Complete',
        `Monthly: ${results.totalMonthly} kg CO₂\nAnnual: ${results.totalAnnual} kg CO₂`
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while saving your results.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <View style={styles.centeredContent}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{currentQuestion.title}</Text>
        {currentQuestion.question && (
          <Text style={styles.subtitle}>{currentQuestion.question}</Text>
        )}

        {isInput ? (
          <TextInput
            style={styles.input}
            value={currentAnswer || ''}
            onChangeText={handleInputChange}
            placeholder="Type here..."
            placeholderTextColor="#7A7A7A"
            keyboardType="numeric"
          />
        ) : (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map(option => (
              <OptionButton
                key={option}
                label={option}
                isSelected={
                  isMultiSelect
                    ? currentAnswer.includes(option)
                    : currentAnswer === option
                }
                onPress={() => handleOptionSelect(option)}
              />
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: scale(10) }}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#555' }]}
              onPress={handleBack}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, { opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            <Text style={styles.buttonText}>
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ProgressIndicator
        currentStep={currentStep}
        totalSteps={steps.length}
        onStepPress={handleStepPress}
        answers={answers}
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vScale(30)
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
    flex: 1,
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
  input: {
    width: scale(200),
    height: vScale(50),
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: scale(15),
    color: '#FFFFFF',
    fontSize: scale(16),
    fontFamily: 'DMSans-Medium',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: vScale(40),
    borderWidth: 1,
    borderColor: '#709775',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default Calculator;
