import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { checkOnboardingStatus } from '../repositories/onboardingRepository';
import { checkIfUserIsAdmin } from '../repositories/adminRepository';
import { scale, vScale } from '../utils/scaling';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if user was remembered
    const checkRememberedUser = async () => {
      const rememberedUid = await AsyncStorage.getItem('rememberedUser');
      const currentUser = auth().currentUser;

      if (rememberedUid && currentUser && currentUser.uid === rememberedUid) {
        const isAdmin = await checkIfUserIsAdmin(currentUser.uid);
        if (isAdmin) navigation.replace('AdminDashboard');
        else navigation.replace('HomeScreen');
      }
    };
    checkRememberedUser();
  }, []);

  const handleRememberMe = (value) => {
    setRememberMe(value);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { user } = await auth().signInWithEmailAndPassword(email.trim(), password);

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUser', user.uid);
      } else {
        await AsyncStorage.removeItem('rememberedUser');
      }

      const isAdmin = await checkIfUserIsAdmin(user.uid);

      if (isAdmin) {
        navigation.replace('AdminDashboard');
      } else {
        const hasOnboarding = await checkOnboardingStatus(user.uid);
        if (hasOnboarding) {
          navigation.replace('HomeScreen');
        } else {
          navigation.replace('Onboarding');
        }
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#709775" />
        <Text style={styles.loadingText}>Signing in...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headContainer}>
        <Text style={styles.head}>Login to TerraTrack</Text>
        <Text style={styles.subhead}>
          Welcome back, resume your {"\n"}environmental journey!
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Password with Eye Icon */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Remember Me */}
        <View style={styles.rememberMeContainer}>
          <Text style={styles.rememberMeText}>Remember Me</Text>
          <Switch
            trackColor={{ false: '#CBCBCB', true: '#709775' }}
            thumbColor="#DDDDDD"
            onValueChange={handleRememberMe}
            value={rememberMe}
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
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
  loadingContainer: {
    justifyContent: 'center',
  },
  loadingText: {
    color: '#709775',
    fontFamily: 'DMSans-Bold',
    marginTop: vScale(20),
    fontSize: scale(14),
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
  inputContainer: { 
    width: '80%', 
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
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#CBCBCB',
    borderRadius: scale(30),
    marginBottom: vScale(15),
    height: vScale(50),
    paddingRight: scale(15),
  },
  eyeIcon: {
    paddingHorizontal: 10,
  },
  rememberMeContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vScale(15),
    paddingHorizontal: scale(10),
  },
  rememberMeText: {
    color: '#CCCCCC',
    fontFamily: 'DMSans-Bold',
    fontSize: scale(12),
  },
  loginButton: {
    backgroundColor: '#415D43',
    fontFamily: 'DMSans-Bold',
    borderRadius: scale(30),
    height: vScale(50),
    marginTop: vScale(10),
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
    marginTop: vScale(20),
    marginBottom: vScale(15),
  },
  signupNow: { 
    color: '#709775', 
    fontFamily: 'DMSans-Bold', 
    fontSize: scale(11) 
  },
});

export default LoginScreen;
