import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import { validateSignUp, authErrorMessages } from '../services/validationService';
import { signUpWithEmail } from '../services/authService';
import { createUserDocument } from '../repositories/userRepository';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessages, setErrorMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
      const { success, user, uid, error, code } = await signUpWithEmail(email, password, userData);
      
      if (!success) {
        let newErrors = {};
        if (authErrorMessages[code]) {
          if (code.includes('username')) newErrors.username = authErrorMessages[code];
          else if (code.includes('email')) newErrors.email = authErrorMessages[code];
          else newErrors.general = authErrorMessages[code];
        } else newErrors.general = error || 'Something went wrong';
        setErrorMessages(prev => ({ ...prev, ...newErrors }));
        setLoading(false);
        return;
      }

      if (!user || !uid) {
        setErrorMessages(prev => ({ ...prev, general: 'Failed to get user ID from Auth.' }));
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

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14) }]}
        placeholder="Username"
        placeholderTextColor="#424242"
        value={formData.username}
        onChangeText={(text) => handleInputChange('username', text)}
        autoCapitalize="none"
      />
      {errorMessages.username && <Text style={styles.errorText}>{errorMessages.username}</Text>}

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14) }]}
        placeholder="Phone Number"
        placeholderTextColor="#424242"
        value={formData.phoneNumber}
        onChangeText={(text) => handleInputChange('phoneNumber', text)}
        keyboardType="phone-pad"
      />
      {errorMessages.phoneNumber && <Text style={styles.errorText}>{errorMessages.phoneNumber}</Text>}

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14) }]}
        placeholder="Password"
        placeholderTextColor="#424242"
        value={formData.password}
        onChangeText={(text) => handleInputChange('password', text)}
        secureTextEntry={true}
      />
      {errorMessages.password && <Text style={styles.errorText}>{errorMessages.password}</Text>}

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14) }]}
        placeholder="Confirm Password"
        placeholderTextColor="#424242"
        value={formData.confirmPassword}
        onChangeText={(text) => handleInputChange('confirmPassword', text)}
        secureTextEntry={true}
      />
      {errorMessages.confirmPassword && <Text style={styles.errorText}>{errorMessages.confirmPassword}</Text>}

      {errorMessages.general && (
        <Text style={[styles.errorText, { textAlign: 'center', marginTop: vScale(10) }]}>{errorMessages.general}</Text>
      )}

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

      <View style={[styles.loginTextContainer, { marginTop: vScale(30) }]}>
        <Text style={[styles.loginPrompt, { fontSize: scale(13) }]}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={[styles.loginLink, { fontSize: scale(13) }]}>Login</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.orContinueText, { fontSize: scale(13), marginTop: vScale(30), marginBottom: vScale(20) }]}>
        Or continue with
      </Text>

      <TouchableOpacity style={[styles.button, { width: inputWidth, height: inputHeight }]}>
        <Text style={styles.buttonText}>Google</Text>
      </TouchableOpacity>
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
  orContinueText: {
    color: '#CCCCCC',
    fontWeight: '700',
    textAlign: 'center',
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
