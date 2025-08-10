import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Onboarding from './screens/Onboarding';
import OnboardingScreen from './screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="SignupScreen" component={SignupScreen} />
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;