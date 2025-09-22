import React, { useState } from 'react';
import { 
  Text, View, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import { checkOnboardingStatus } from '../repositories/onboardingRepository';
import { checkIfUserIsAdmin } from '../repositories/adminRepository';
import { scale, vScale } from '../utils/scaling';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { user } = await auth().signInWithEmailAndPassword(email.trim(), password);
      
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

      <View style={styles.inputcontainer}>
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
            secureTextEntry={secureText}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            style={styles.iconContainer} 
            onPress={() => setSecureText(!secureText)}
          >
            <Ionicons 
              name={secureText ? 'eye-off' : 'eye'} 
              size={20} 
              color="#333" 
            />
          </TouchableOpacity>
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
  inputcontainer: { 
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
    backgroundColor: '#CBCBCB',
    borderRadius: scale(30),
    marginBottom: vScale(15),
    width: '100%',
    height: vScale(50),
    paddingRight: scale(15),
  },
  iconContainer: {
    paddingLeft: scale(10),
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
});

export default LoginScreen;
