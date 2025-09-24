import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getUserTerraCoins } from '../repositories/userRepository';
import { incrementUserStat } from '../repositories/userStatsRepository';
import firestore from '@react-native-firebase/firestore';

const EducationalDetailScreen = ({ route, navigation }) => {
  const { content } = route.params; // content should have an "id"
  const { user } = useAuth();
  const [terraCoins, setTerraCoins] = useState(0);
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTerraCoins();
      checkIfRead(); // ✅ check read status from Firestore
    }
  }, [user]);

  const fetchTerraCoins = async () => {
    try {
      const result = await getUserTerraCoins(user.uid); 
      if (result.success) {
        setTerraCoins(result.terraCoins);
      }
    } catch (error) {
      console.error('Error fetching TerraCoins:', error);
    }
  };

  // ✅ Check Firestore if this content is already read
  const checkIfRead = async () => {
    try {
      const docRef = firestore()
        .collection('users')
        .doc(user.uid)
        .collection('materialsRead')
        .doc(content.id); // assumes content has an id
      const doc = await docRef.get();
      if (doc.exists && doc.data().read) {
        setIsRead(true);
      }
    } catch (error) {
      console.error("Error checking read status:", error);
    }
  };

  // ✅ Handle marking as read
  const handleMaterialRead = async () => {
    try {
      if (!user?.uid) return;

      // 1. Increment stats
      await incrementUserStat(user.uid, "educationalMaterialsRead");

      // 2. Save read status in Firestore
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('materialsRead')
        .doc(content.id) // each material tracked separately
        .set({
          read: true,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });

      setIsRead(true);
      Alert.alert("Progress Saved", "Marked as read! 📘");
    } catch (error) {
      console.error("Error incrementing educationalMaterialsRead:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image source={require('../assets/images/TerraCoin.png')} style={styles.coinImage} />
          <Text style={styles.coinText}>{terraCoins}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.detailWrapper}>
          <View style={styles.detailContainer}>
            <Text style={styles.detailTitle}>{content.title}</Text>
            <Text style={styles.detailDescription}>{content.description}</Text>

            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{content.content}</Text>
            </View>

            {/* ✅ Mark as Read button */}
            <TouchableOpacity
              style={[
                styles.readButton,
                isRead && { backgroundColor: '#888' }
              ]}
              onPress={handleMaterialRead}
              disabled={isRead}
            >
              <Text style={styles.quizButtonText}>
                {isRead ? "Already Read" : "Mark as Read"}
              </Text>
            </TouchableOpacity>

            {/* ✅ Quiz button */}
            <TouchableOpacity
              style={styles.quizButton}
              onPress={() => {
                navigation.navigate('EducationalQuizScreen', { content });
              }}
            >
              <Text style={styles.quizButtonText}>Take the Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topBar: {
    height: 90,
    backgroundColor: '#415D43',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 10,
    marginBottom: 12,
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
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    color: '#CCCCCC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -80,
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