import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getUserTerraCoins } from '../repositories/userRepository';
import { incrementUserStat } from '../repositories/userStatsRepository';
import firestore from '@react-native-firebase/firestore';
import HeaderRow from '../components/HeaderRow';
import ConfirmationPopup from '../components/ConfirmationPopup';

const EducationalDetailScreen = ({ route, navigation }) => {
  const { content } = route.params;
  const { user } = useAuth();
  const [terraCoins, setTerraCoins] = useState(0);
  const [isRead, setIsRead] = useState(false);
  const [hasTakenQuiz, setHasTakenQuiz] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showQuizConfirmation, setShowQuizConfirmation] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    if (user) {
      fetchTerraCoins();
      checkIfRead();
      checkIfQuizTaken();
    }
  }, [user]);

  const showMessage = (title, message, type = 'success') => {
    setPopupConfig({
      title,
      message,
      type
    });
    setShowInfoPopup(true);
  };

  const showQuizConfirmationPopup = () => {
    setShowQuizConfirmation(true);
  };

  const navigateToQuiz = () => {
    setShowQuizConfirmation(false);
    navigation.navigate('EducationalQuizScreen', { content });
  };

  const fetchTerraCoins = async () => {
    try {
      const result = await getUserTerraCoins(user.uid);
      if (result.success) {
        setTerraCoins(result.terraCoins);
      }
    } catch (error) {
      console.error('Error fetching TerraCoins:', error);
      showMessage('Error', 'Failed to load your Terra Coins balance.', 'error');
    }
  };

  // Check if material already read
  const checkIfRead = async () => {
    try {
      if (!user?.uid || !content?.id) return;
      const docRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('materialsRead')
        .doc(content.id);

      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data();
        setIsRead(!!data.read);
      } else {
        setIsRead(false);
      }
    } catch (error) {
      console.log('⚠️ No existing read record (not an error):', error?.message);
      setIsRead(false);
    }
  };

  // Check Firestore if quiz already answered
  const checkIfQuizTaken = async () => {
    try {
      if (!user?.uid || !content?.id) return;

      const quizAttemptsRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('quiz_attempts');

      const snapshot = await quizAttemptsRef
        .where('contentId', '==', content.id)
        .limit(1)
        .get();

      setHasTakenQuiz(!snapshot.empty);
    } catch (error) {
      console.error('Error checking quiz attempts:', error);
      setHasTakenQuiz(false);
    }
  };

  const handleMaterialRead = async () => {
    try {
      if (!user?.uid) return;

      await incrementUserStat(user.uid, 'educationalMaterialsRead');

      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('materialsRead')
        .doc(content.id)
        .set({
          read: true,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });

      setIsRead(true);
      showMessage('Progress Saved', 'Material marked as read! You can now take the quiz.');
    } catch (error) {
      console.error('Error incrementing educationalMaterialsRead:', error);
      showMessage('Error', 'Failed to mark as read. Please try again.', 'error');
    }
  };

  const handleQuizPress = () => {
    if (!isRead) {
      showMessage(
        'Read First', 
        'Please mark the material as read before taking the quiz.',
        'error'
      );
      return;
    }

    if (hasTakenQuiz) {
      showMessage(
        'Quiz Completed', 
        'You have already completed this quiz. Great job!',
        'success'
      );
      return;
    }

    // Show confirmation popup
    showQuizConfirmationPopup();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image
            source={require('../assets/images/TerraCoin.png')}
            style={styles.coinImage}
          />
          <Text style={styles.coinText}>{terraCoins}</Text>
        </View>
      </View>

      <View style={styles.headerContainer}>
        <HeaderRow
          title="Educational Material"
          onBackPress={() => navigation.goBack()}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.detailWrapper}>
          <View style={styles.detailContainer}>
            <Text style={styles.detailTitle}>{content.title}</Text>
            <Text style={styles.detailDescription}>{content.description}</Text>

            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{content.content}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.readButton,
                isRead && { backgroundColor: '#888' },
              ]}
              onPress={handleMaterialRead}
              disabled={isRead}
            >
              <Text style={styles.quizButtonText}>
                {isRead ? 'Already Read' : 'Mark as Read'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quizButton,
                hasTakenQuiz && { backgroundColor: '#888' },
              ]}
              onPress={handleQuizPress}
              disabled={hasTakenQuiz}
            >
              <Text style={styles.quizButtonText}>
                {hasTakenQuiz ? 'Quiz Completed' : 'Take the Quiz'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ConfirmationPopup
        visible={showInfoPopup}
        title={popupConfig.title}
        message={popupConfig.message}
        confirmText="OK"
        type={popupConfig.type}
        onConfirm={() => setShowInfoPopup(false)}
      />

      <ConfirmationPopup
        visible={showQuizConfirmation}
        title="Ready for the Quiz?"
        message="Once you start the quiz, you won't be able to go back to this material until you complete it. Make sure you're ready!"
        confirmText="Start Quiz"
        cancelText="Not Yet"
        type="success"
        showCancel={true}
        onConfirm={navigateToQuiz}
        onCancel={() => setShowQuizConfirmation(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  topBar: {
    height: 90,
    backgroundColor: '#415D43',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 10,
  },
  headerContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  coinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  coinImage: {
    width: 20,
    height: 20,
    marginRight: 6,
    resizeMode: 'contain',
  },
  coinText: {
    color: '#131313',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContainer: {
    width: '100%',
    alignItems: 'center',
  },
  detailTitle: {
    color: '#709775',
    fontSize: 24,
    fontFamily: 'DMSans-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  detailDescription: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: 'DMSans-Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  contentBox: {
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    padding: 40,
    width: '100%',
    marginBottom: 20,
  },
  contentText: {
    color: '#161616',
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
  },
  readButton: {
    backgroundColor: '#709775',
    paddingVertical: 14,
    borderRadius: 30,
    width: '100%',
    marginBottom: 12,
  },
  quizButton: {
    backgroundColor: '#415D43',
    paddingVertical: 14,
    borderRadius: 30,
    width: '100%',
  },
  quizButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
  },
});

export default EducationalDetailScreen;