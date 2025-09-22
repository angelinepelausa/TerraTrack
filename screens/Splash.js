import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scale, vScale } from '../utils/scaling';
import { checkIfUserIsAdmin } from '../repositories/adminRepository';

const SplashScreen = ({ navigation }) => {

  useEffect(() => {
    const checkUser = async () => {
      try {
        const rememberedUid = await AsyncStorage.getItem('rememberedUser');
        const currentUser = auth().currentUser;

        if (rememberedUid && currentUser && currentUser.uid === rememberedUid) {
          const isAdmin = await checkIfUserIsAdmin(currentUser.uid);

          if (isAdmin) {
            navigation.replace('AdminDashboard');
          } else {
            navigation.replace('HomeScreen');
          }
        }
        // else stay on splash/login screen
      } catch (err) {
        console.error('Error checking remembered user', err);
      }
    };

    checkUser();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Image 
          source={require('../assets/images/SplashImage.png')} 
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>TerraTrack</Text>
        <Text style={styles.subtitle}>Maximize your positive environmental impact!</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation.navigate('LoginScreen')}
          >
            <Text style={[styles.buttonText, styles.loginText]}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={() => navigation.navigate('SignupScreen')}
          >
            <Text style={[styles.buttonText, styles.registerText]}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    justifyContent: 'center',
    paddingHorizontal: scale(40), 
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center', 
  },
  image: {
    width: scale(300),
    height: scale(300),
    marginBottom: vScale(30),
  },
  title: {
    color: '#709775',
    fontSize: scale(48),
    fontFamily: 'DMSans-Bold',
    marginBottom: vScale(10),
    textAlign: 'center', 
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: scale(15),
    fontFamily: 'DMSans-Regular',
    marginBottom: vScale(80),
    textAlign: 'center', 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    width: '100%',
    maxWidth: scale(400),
    gap: scale(20), 
  },
  button: {
    width: scale(160),
    height: vScale(53),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#415D43',
  },
  registerButton: {
    backgroundColor: '#CBCBCB',
  },
  buttonText: {
    fontSize: scale(14),
    fontFamily: 'DMSans-Medium',
  },
  loginText: {
    color: '#DDDDDD',
  },
  registerText: {
    color: '#131313',
  },
});

export default SplashScreen;
