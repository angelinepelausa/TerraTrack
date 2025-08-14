import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { checkOnboardingStatus } from '../repositories/onboardingRepository';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      const { user } = await auth().signInWithEmailAndPassword(email.trim(), password);
      const hasOnboarding = await checkOnboardingStatus(user.uid);

      if (hasOnboarding) {
        navigation.replace('HomeScreen');
      } else {
        navigation.replace('Onboarding');
      }
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
      const { user } = await auth().signInWithCredential(googleCredential);

      const hasOnboarding = await checkOnboardingStatus(user.uid);

      if (hasOnboarding) {
        navigation.replace('HomeScreen');
      } else {
        navigation.replace('Onboarding');
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
      Alert.alert('Sign-In Failed', err.message || 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headContainer}>
        <Text style={styles.head}>Login to TerraTrack</Text>
        <Text style={styles.subhead}>
          Welcome back, resume your {"\n"}environmental journey!
        </Text>
      </View>

      <View style={styles.inputcontainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#131313' },
  headContainer: { padding: '4.5%', marginTop: '35%', alignItems: 'center' },
  head: { fontSize: 30, color: '#709775', marginBottom: '6%', fontFamily: 'DMSans-Bold' },
  subhead: { fontSize: 14, color: '#CCCCCC', fontFamily: 'DMSans-Bold', textAlign: 'center' },
  inputcontainer: { width: '75%', marginTop: '10%' },
  input: {
    backgroundColor: '#CBCBCB',
    fontFamily: 'DMSans-Bold',
    borderRadius: 30,
    height: 50,
    marginBottom: 15,
    fontSize: 11,
    paddingLeft: 20,
  },
  loginButton: {
    backgroundColor: '#415D43',
    fontFamily: 'DMSans-Bold',
    borderRadius: 30,
    height: 50,
    marginTop: '13%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: { fontFamily: 'DMSans-Bold', color: '#DDDDDD' },
  signupText: {
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: '7%',
    marginTop: '8%',
  },
  signupNow: { color: '#709775', fontFamily: 'DMSans-Bold', fontSize: 11 },
  texts: { marginTop: 30, width: '75%', alignItems: 'center' },
  googleButton: {
    backgroundColor: '#415D43',
    fontFamily: 'DMSans-Bold',
    borderRadius: 30,
    height: 50,
    marginTop: 10,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;
