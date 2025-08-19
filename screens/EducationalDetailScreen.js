import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const EducationalDetailScreen = ({ route, navigation }) => {
  const { content } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.coinBox}>
          <Image source={require('../assets/images/TerraCoin.png')} style={styles.coinImage} />
          <Text style={styles.coinText}>0</Text>
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

            <TouchableOpacity 
              style={styles.quizButton} 
              onPress={() => {
                console.log("Navigating to EducationalQuizScreen with content:", content);
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
    backgroundColor: '#131313' 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 16 
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
    fontSize: 12 
  },
  backBtn: { 
    marginBottom: 16 
  },
  backText: { 
    color: '#CCCCCC', 
    fontSize: 20, 
    fontWeight: 'bold' 
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
