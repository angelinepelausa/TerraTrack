import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import { addUserRewards } from '../repositories/userRepository';
import { saveQuizAttempt } from '../repositories/quizAttemptsRepository';
import QuizResult from '../components/QuizResult';

const EducationalQuizScreen = ({ route, navigation }) => {
  const { content } = route.params;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [quizFinished, setQuizFinished] = useState(false);
  const [rewards, setRewards] = useState({ coins: 0, points: 0 });

  const questions = content.quiz.questions;
  const question = questions[currentQuestion];

  const handleSubmit = async () => {
    setSubmitted(true);

    const isCorrect = selectedAnswer === question.correctIndex;
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      total: score.total + 1
    };
    setScore(newScore);

    if (isCorrect) {
      try {
        const userId = auth().currentUser?.uid;
        if (userId) {
          await addUserRewards(userId, 1, 10); 
        }
      } catch (error) {
        console.error("Failed to add rewards:", error);
      }
    }
  };

  const handleContinue = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
    } else {
      try {
        const coinsEarned = score.correct * 1;
        const pointsEarned = score.correct * 10;

        await saveQuizAttempt({
          contentId: content.id,
          correctAnswers: score.correct,
          totalQuestions: score.total,
          coinsEarned,
          pointsEarned,
          timeTaken: 0,
        });

        setRewards({ coins: coinsEarned, points: pointsEarned });
        setQuizFinished(true);
      } catch (error) {
        console.error('Failed to save quiz attempt:', error);
      }
    }
  };

  if (quizFinished) {
    return <QuizResult rewards={rewards} navigation={navigation} />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>

      <View style={styles.quizContainer}>
        <Text style={styles.quizTitle}>{content.title}</Text>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.text}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = question.correctIndex === index;

              return (
                <View key={index} style={styles.optionWrapper}>
                  <TouchableOpacity
                    disabled={submitted} 
                    style={[
                      styles.optionButton,
                      isSelected && !submitted && styles.selectedOption,
                      submitted && isCorrect && styles.correctOption,
                      submitted && isSelected && !isCorrect && styles.wrongOption,
                    ]}
                    onPress={() => setSelectedAnswer(index)}
                  >
                    <Text style={styles.optionText}>{option}</Text>

                    {submitted && isCorrect && (
                      <Image 
                        source={require('../assets/images/QuizRight.png')} 
                        style={styles.resultIcon} 
                      />
                    )}
                    {submitted && isSelected && !isCorrect && (
                      <Image 
                        source={require('../assets/images/QuizWrong.png')} 
                        style={styles.resultIcon} 
                      />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {!submitted && selectedAnswer !== null && (
        <TouchableOpacity 
          style={[styles.optionButton, styles.submitButton, styles.fixedButton]} 
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      )}

      {submitted && (
        <TouchableOpacity 
          style={[styles.optionButton, styles.continueButton, styles.fixedButton]} 
          onPress={handleContinue}
        >
          <Text style={styles.submitText}>
            {currentQuestion < questions.length - 1 ? "Continue" : "Finish"}
          </Text>
        </TouchableOpacity>
      )}

      <Image 
        source={require('../assets/images/BearQuiz.png')} 
        style={styles.bearImage} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#131313',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: { 
    marginBottom: 16,
    alignSelf: 'flex-start'
  },
  backText: { 
    color: '#CCCCCC', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  quizContainer: {
    flex: 1,
    justifyContent: 'flex-start', 
    alignItems: 'center',
    paddingTop: 120, 
  },
  quizTitle: {
    color: '#709775',
    fontSize: 19,
    fontFamily: 'DMSans-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  questionText: {
    color: '#CCCCCC',
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  optionWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  optionButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: 30,
    padding: 15,
    marginVertical: 8,
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#709775',
  },
  optionText: {
    color: '#131313',
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    textAlign: 'left',
    flex: 1,
  },
  resultIcon: {
    width: 20,
    height: 20,
    marginLeft: 10,
    resizeMode: 'contain',
  },
  submitButton: {
    backgroundColor: '#415D43',
  },
  continueButton: {
    backgroundColor: '#415D43',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
    flex: 1,
  },
  fixedButton: {
    position: 'absolute',
    bottom: 40, 
    alignSelf: 'center',
    zIndex: 2,
  },
  bearImage: {
    position: 'absolute',
    bottom: 0,
    left: -25,
    resizeMode: 'contain',
    width: 250,
    height: 250,
    zIndex: 1,
  },
});

export default EducationalQuizScreen;
