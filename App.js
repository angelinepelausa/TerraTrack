import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Onboarding from './screens/Onboarding';
import OnboardingScreen from './screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="LoginScreen"
          screenOptions={{ 
            headerShown: false,
            animation: 'fade' // Optional: adds smooth transition between screens
          }}
        >
          <Stack.Screen 
            name="LoginScreen" 
            component={LoginScreen} 
            options={{ gestureEnabled: false }} // Prevent swipe back on login
          />
          <Stack.Screen 
            name="SignupScreen" 
            component={SignupScreen} 
          />
          <Stack.Screen 
            name="Onboarding" 
            component={Onboarding} 
            options={{ gestureEnabled: false }} // Prevent swipe back during onboarding
          />
          <Stack.Screen 
            name="OnboardingScreen" 
            component={OnboardingScreen}
            options={{ gestureEnabled: false }} // Prevent swipe back during onboarding
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;