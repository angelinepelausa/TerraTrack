import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { addUserRewards } from '../repositories/userRepository';
import { hasAttemptedQuiz, saveQuizAttempt } from '../repositories/quizAttemptsRepository';
import QuizResult from '../components/QuizResult';
import HeaderRow from '../components/HeaderRow';
import { incrementWeeklyQuizFinished } from '../repositories/userStatsRepository';


// ✅ Get Monday of current week (YYYY-MM-DD)
const getMondayDate = () => {
  const today = new Date();
  const day = today.getDay(); // 0=Sunday, 1=Monday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0]; // YYYY-MM-DD
};

const WeeklyQuizScreen = ({ navigation }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [rewards, setRewards] = useState(null); // ✅ For QuizResult

  const mondayDate = getMondayDate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const attempted = await hasAttemptedQuiz(`weekly_${mondayDate}`);
        setAlreadyAttempted(attempted);

        if (attempted) {
          setLoading(false);
          return;
        }

        const quizDoc = await firestore().collection('weekly_quizzes').doc(mondayDate).get();

        if (quizDoc.exists) {
          setQuiz(quizDoc.data());
        } else {
          Alert.alert("No Quiz", "This week's quiz is not available yet.");
        }
      } catch (error) {
        console.error("Error fetching weekly quiz:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [mondayDate]);

  const handleSubmit = async () => {
    if (!quiz) return;

    setSubmitted(true);

    const isCorrect = selectedAnswer === quiz.correctIndex;
    const earnedCoins = isCorrect ? 5 : 0;
    const earnedPoints = isCorrect ? 50 : 0;

    setRewards({
      coins: earnedCoins,
      points: earnedPoints,
    });

    if (isCorrect) {
      try {
        const userId = auth().currentUser?.uid;
        if (userId) {
          await addUserRewards(userId, earnedCoins, earnedPoints);
        }
      } catch (error) {
        console.error("Failed to add rewards:", error);
      }
    }

    try {
      await saveQuizAttempt({
        contentId: `weekly_${mondayDate}`,
        correctAnswers: isCorrect ? 1 : 0,
        totalQuestions: 1,
        coinsEarned: earnedCoins,
        pointsEarned: earnedPoints,
        timeTaken: 0,
        type: "weekly"
      });

      const userId = auth().currentUser?.uid;
      if (userId) {
        await incrementWeeklyQuizFinished(userId);
      }
      
    } catch (error) {
      console.error("Failed to save weekly quiz attempt:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#709775" />
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>No weekly quiz found.</Text>
        <TouchableOpacity
          style={[styles.optionButton, styles.continueButton, styles.fixedButton]}
          onPress={() => navigation.navigate("HomeScreen")}
        >
          <Text style={styles.submitText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (submitted && rewards) {
    return <QuizResult rewards={rewards} navigation={navigation} redirectTo="HomeScreen" />;
  }

  return (
    <View style={styles.container}>
      {/* HeaderRow at top */}
      <HeaderRow
        title="Weekly Quiz"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.quizContainer}>
        {/* Quiz Title fetched from Firestore */}
        <Text style={styles.quizTitle}>{quiz.title || 'Weekly Quiz'}</Text>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{quiz.question}</Text>

          <View style={styles.optionsContainer}>
            {quiz.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = quiz.correctIndex === index;

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
  },
  quizContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
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
  correctOption: {
    backgroundColor: '#D9D9D9',
  },
  wrongOption: {
    backgroundColor: '#E57373',
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
  infoText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default WeeklyQuizScreen;
