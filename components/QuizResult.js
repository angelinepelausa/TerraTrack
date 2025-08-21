import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const QuizResult = ({ rewards, navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.resultTitle}>Congratulations on{"\n"}Completing the Quiz!</Text>
      <Text style={styles.resultSubtitle}>Here are your rewards!</Text>

      <View style={styles.rewardsBox}>
        <View style={styles.rewardRow}>
          <Image 
            source={require('../assets/images/TerraCoin.png')} 
            style={styles.rewardIcon} 
          />
          <Text style={styles.rewardText}>
            {rewards.coins} Terra Coin{rewards.coins !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.rewardRow}>
          <Image 
            source={require('../assets/images/TerraPoint.png')} 
            style={styles.rewardIcon} 
          />
          <Text style={styles.rewardText}>{rewards.points} Terra Points</Text>
        </View>

        <Image 
          source={require('../assets/images/BearResult.png')} 
          style={styles.bearResult} 
        />
      </View>

      <TouchableOpacity 
        style={[styles.optionButton, styles.continueButton, styles.resultButton]} 
        onPress={() => navigation.navigate("EducationalScreen")}
      >
        <Text style={styles.resultButtonText}>Continue</Text>
      </TouchableOpacity>
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
  resultTitle: {
    color: '#709775',
    fontSize: 28,
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardsBox: {
    backgroundColor: '#CCCCCC',
    borderRadius: 25,
    paddingVertical: 20, 
    paddingHorizontal: 40, 
    width: '90%', 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 10,
  },
  rewardText: {
    color: '#131313',
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
  },
  bearResult: {
    position: 'absolute',
    bottom: -40,
    right: -70,
    width: 180,
    height: 180,
    resizeMode: 'contain',
    zIndex: 2,
  },
  optionButton: {
    backgroundColor: '#D9D9D9',
    borderRadius: 30,
    padding: 15,
    marginVertical: 8,
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#415D43',
  },
  resultButton: {
    marginTop: 20,
    width: '90%',
    borderRadius: 25,
    alignSelf: 'center',
  },
  resultButtonText: {
    color: '#DDDDDD',
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
    flex: 1,
  },
});

export default QuizResult;
