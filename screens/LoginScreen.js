import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { scale, vScale } from '../utils/scaling';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '311055895923-v5psnf225qdpe5rtpv2rpvfuqinboc0v.apps.googleusercontent.com',
      offlineAccess: false,
      forceCodeForRefreshToken: true,
      scopes: ['openid', 'email', 'profile'],
    });
  }, []);

  const handleLogin = async () => {
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
      Alert.alert('Success', `Welcome ${email}`);
      navigation.replace('Onboarding');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const { idToken } = await GoogleSignin.signIn();
      if (!idToken) throw new Error('No ID token returned from Google Sign-In');

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);

      Alert.alert('Welcome', 'Signed in with Google');
      navigation.replace('Onboarding');
    } catch (err) {
      console.error('Google Sign-In error:', err);
      Alert.alert('Sign-In Failed', err.message || 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headContainer}>
          <Text style={styles.head}>Login to TerraTrack</Text>
          <Text style={styles.subhead}>
            Welcome back, resume your {"\n"}environmental journey!
          </Text>
        </View>

        <View style={styles.inputcontainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <Text style={styles.signupText}>
            Don't have an account?{' '}
            <Text
              style={styles.signupNow}
              onPress={() => navigation.navigate('SignupScreen')}
            >
              Sign up
            </Text>
          </Text>
        </View>

        <View style={styles.texts}>
          <Text style={styles.signupText}>Or continue with</Text>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Text style={styles.loginButtonText}>Google</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#131313' 
  },
  content: {
    width: '85%',
    alignItems: 'center',
  },
  headContainer: { 
    padding: scale(18), 
    alignItems: 'center',
    marginBottom: vScale(20) 
  },
  head: { 
    fontSize: scale(30), 
    color: '#709775', 
    marginBottom: vScale(10), 
    fontFamily: 'DMSans-Bold' 
  },
  subhead: { 
    fontSize: scale(14), 
    color: '#CCCCCC', 
    fontFamily: 'DMSans-Bold', 
    textAlign: 'center' 
  },
  inputcontainer: { 
    width: '100%', 
    marginTop: vScale(20), 
    alignItems: 'center' 
  },
  input: {
    backgroundColor: '#CBCBCB',
    fontFamily: 'DMSans-Bold',
    borderRadius: scale(30),
    height: vScale(50),
    marginBottom: vScale(15),
    fontSize: scale(11),
    paddingLeft: scale(20),
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#415D43',
    fontFamily: 'DMSans-Bold',
    borderRadius: scale(30),
    height: vScale(50),
    marginTop: vScale(15),
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loginButtonText: { 
    fontFamily: 'DMSans-Bold', 
    color: '#DDDDDD', 
    fontSize: scale(12) 
  },
  signupText: {
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(11),
    textAlign: 'center',
    marginTop: vScale(35),
    marginBottom: vScale(15),
  },
  signupNow: { 
    color: '#709775', 
    fontFamily: 'DMSans-Bold', 
    fontSize: scale(11) 
  },
  texts: { 
    marginTop: vScale(15), 
    width: '100%', 
    alignItems: 'center' 
  },
  googleButton: {
    backgroundColor: '#415D43',
    fontFamily: 'DMSans-Bold',
    borderRadius: scale(30),
    height: vScale(50),
    marginTop: vScale(10),
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;
