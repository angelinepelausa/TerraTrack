import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // 👁️ Import icons
import { scale, vScale } from '../utils/scaling';
import { validateSignUp, authErrorMessages } from '../services/validationService';
import { signUpWithEmail } from '../services/authService';
import { createUserDocument } from '../repositories/userRepository';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessages, setErrorMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 👁️ States for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async () => {
    const { isValid, errors } = validateSignUp(formData);
    setErrorMessages(errors);
    if (!isValid) return;

    setLoading(true);
    const { email, password, ...userData } = formData;

    try {
      // 1️⃣ Create account in Firebase Auth
      const { success: authSuccess, error: authError, code } = await signUpWithEmail(email, password, userData);
      if (!authSuccess) {
        let newErrors = {};
        if (authErrorMessages[code]) {
          if (code.includes('username')) newErrors.username = authErrorMessages[code];
          else if (code.includes('email')) newErrors.email = authErrorMessages[code];
          else newErrors.general = authErrorMessages[code];
        } else newErrors.general = authError || 'Something went wrong';
        setErrorMessages(prev => ({ ...prev, ...newErrors }));
        setLoading(false);
        return;
      }

      // 2️⃣ Add user document in Firestore
      const userId = authSuccess.user.uid;
      const userDocResult = await createUserDocument({ ...userData, userId });
      if (!userDocResult.success) {
        setErrorMessages(prev => ({ ...prev, general: 'Failed to create user profile.' }));
        setLoading(false);
        return;
      }

      setShowSuccess(true);
    } catch (err) {
      console.error('Sign up error:', err);
      setErrorMessages(prev => ({ ...prev, general: 'Something went wrong' }));
    } finally {
      setLoading(false);
    }
  };

  const inputWidth = scale(308);
  const inputHeight = vScale(53);

  if (showSuccess) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Image
          source={require('../assets/images/SplashImage.png')}
          style={{ width: scale(300), height: scale(300), marginBottom: vScale(30) }}
          resizeMode="contain"
        />
        <Text style={[styles.title, { fontSize: scale(32), marginBottom: vScale(10) }]}>Account Created!</Text>
        <Text style={[styles.subtitle, { fontSize: scale(15), marginBottom: vScale(80), textAlign: 'center' }]}>
          Your account has been created successfully.
        </Text>
        <TouchableOpacity
          style={[styles.button, { width: inputWidth, height: inputHeight }]}
          onPress={() => navigation.navigate('LoginScreen')}
        >
          <Text style={styles.buttonText}>Continue to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingVertical: vScale(40) }]}>
      <Text style={[styles.title, { fontSize: scale(32), marginBottom: vScale(20) }]}>
        Create account
      </Text>
      <Text style={[styles.subtitle, { fontSize: scale(15), marginBottom: vScale(40), lineHeight: vScale(20) }]}>
        Create an account to start maximizing{"\n"}your environmental impact!
      </Text>

      {/* Email */}
      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14) }]}
        placeholder="Email"
        placeholderTextColor="#424242"
        value={formData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {errorMessages.email && <Text style={styles.errorText}>{errorMessages.email}</Text>}

      {/* Username */}
      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14) }]}
        placeholder="Username"
        placeholderTextColor="#424242"
        value={formData.username}
        onChangeText={(text) => handleInputChange('username', text)}
        autoCapitalize="none"
      />
      {errorMessages.username && <Text style={styles.errorText}>{errorMessages.username}</Text>}

      {/* Password with toggle */}
      <View style={[styles.input, styles.passwordContainer, { width: inputWidth, height: inputHeight }]}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#424242"
          value={formData.password}
          onChangeText={(text) => handleInputChange('password', text)}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#424242" />
        </TouchableOpacity>
      </View>
      {errorMessages.password && <Text style={styles.errorText}>{errorMessages.password}</Text>}

      {/* Confirm Password with toggle */}
      <View style={[styles.input, styles.passwordContainer, { width: inputWidth, height: inputHeight }]}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          placeholderTextColor="#424242"
          value={formData.confirmPassword}
          onChangeText={(text) => handleInputChange('confirmPassword', text)}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#424242" />
        </TouchableOpacity>
      </View>
      {errorMessages.confirmPassword && <Text style={styles.errorText}>{errorMessages.confirmPassword}</Text>}

      {errorMessages.general && (
        <Text style={[styles.errorText, { textAlign: 'center', marginTop: vScale(10) }]}>{errorMessages.general}</Text>
      )}

      {/* Sign Up Button */}
      <TouchableOpacity
        style={[styles.button, { width: inputWidth, height: inputHeight, marginTop: vScale(20) }, loading && styles.disabledButton]}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Sign up</Text>
        )}
      </TouchableOpacity>

      {/* Login Link */}
      <View style={[styles.loginTextContainer, { marginTop: vScale(30) }]}>
        <Text style={[styles.loginPrompt, { fontSize: scale(13) }]}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={[styles.loginLink, { fontSize: scale(13) }]}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    justifyContent: 'center',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    color: '#709775',
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    color: '#CCCCCC',
    textAlign: 'center',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#CBCBCB',
    borderRadius: 30,
    paddingHorizontal: 30,
    color: '#424242',
    fontWeight: '700',
    marginBottom: vScale(20),
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  passwordInput: {
    flex: 1,
    color: '#424242',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#415D43',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginPrompt: {
    color: '#CCCCCC',
    fontWeight: '700',
  },
  loginLink: {
    color: '#709775',
    fontWeight: '700',
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: scale(12),
    fontStyle: 'italic',
    fontWeight: '500',
    width: scale(308),
    textAlign: 'left',
    marginTop: -vScale(15),
    marginBottom: vScale(10),
  },
});

export default SignUpScreen;
