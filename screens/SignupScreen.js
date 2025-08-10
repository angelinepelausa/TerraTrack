import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { scale, vScale } from '../utils/scaling';
import { signUpWithEmail } from '../services/authService';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    phoneNumber: '+639',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (name, value) => {
    if (name === 'phoneNumber' && !value.startsWith('+639')) {
      value = value.length < 4 ? '+639' : `+639${value.substring(4)}`;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const { email, password, confirmPassword, ...userData } = formData;

    const { success, error, code } = await signUpWithEmail(email, password, userData);

    setLoading(false);

    if (success) {
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } else {
      if (code === 'permission-denied') {
        Alert.alert(
          'Permission Error',
          'Cannot create account. Please make sure you have the latest app version.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', error);
      }
    }
  };

  const inputWidth = scale(308);
  const inputHeight = vScale(53);

  return (
    <View style={[styles.container, { paddingVertical: vScale(40) }]}>
      <Text style={[styles.title, { fontSize: scale(32), marginBottom: vScale(20) }]}>
        Create account
      </Text>
      <Text style={[styles.subtitle, { fontSize: scale(15), marginBottom: vScale(40), lineHeight: vScale(20) }]}>
        Create an account to start maximizing{"\n"}your environmental impact!
      </Text>

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14), marginBottom: vScale(20) }]}
        placeholder="Email"
        placeholderTextColor="#424242"
        value={formData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14), marginBottom: vScale(20) }]}
        placeholder="Username"
        placeholderTextColor="#424242"
        value={formData.username}
        onChangeText={(text) => handleInputChange('username', text)}
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14), marginBottom: vScale(20) }]}
        placeholder="Phone Number"
        placeholderTextColor="#424242"
        value={formData.phoneNumber}
        onChangeText={(text) => handleInputChange('phoneNumber', text)}
        keyboardType="phone-pad"
      />

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14), marginBottom: vScale(20) }]}
        placeholder="Password"
        placeholderTextColor="#424242"
        value={formData.password}
        onChangeText={(text) => handleInputChange('password', text)}
        secureTextEntry={true}
      />

      <TextInput
        style={[styles.input, { width: inputWidth, height: inputHeight, fontSize: scale(14), marginBottom: vScale(20) }]}
        placeholder="Confirm Password"
        placeholderTextColor="#424242"
        value={formData.confirmPassword}
        onChangeText={(text) => handleInputChange('confirmPassword', text)}
        secureTextEntry={true}
      />

      <TouchableOpacity
        style={[
          styles.button,
          { width: inputWidth, height: inputHeight, marginTop: vScale(20) },
          loading && styles.disabledButton
        ]}
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

      <TouchableOpacity
        style={[styles.button, { width: inputWidth, height: inputHeight }]}
      >
        <Text style={styles.buttonText}>Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    justifyContent: 'flex-start',
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
});

export default SignUpScreen;