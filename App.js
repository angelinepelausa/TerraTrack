import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';

import { subscribeToNetwork, checkNetworkNow } from './services/networkService';
import NoInternetPopup from './components/NoInternetPopup';

// Screens
import SplashScreen from './screens/Splash';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import Onboarding from './screens/Onboarding';
import OnboardingScreen from './screens/OnboardingScreen';
import Calculator from './screens/Calculator';
import HomeScreen from './screens/HomeScreen';
import MainTabs from './navigation/MainTabs';
import ResultsScreen from './screens/ResultsScreen';
import EducationalScreen from './screens/EducationalScreen';
import EducationalDetailScreen from './screens/EducationalDetailScreen';
import EducationalQuizScreen from './screens/EducationalQuizScreen';
import WeeklyQuizScreen from './screens/WeeklyQuizScreen';
import InviteScreen from './screens/InviteScreen';
import CommunityProgressScreen from './screens/CommunityProgressScreen';
import CameraVerificationScreen from './screens/CameraVerificationScreen';
import TaskVerifyScreen from './screens/TaskVerifyScreen';
import VerifyTaskScreen from './screens/VerifyTaskScreen';
import AdminDashboard from './screens/AdminDashboard';
import AdminUserManagement from './screens/AdminUserManagement';
import AdminEducationalMaterials from './screens/AdminEducationalMaterials';
import AddEducationalMaterial from './screens/AddEducationalMaterial';
import AdminWeeklyQuiz from './screens/AdminWeeklyQuiz';
import AddWeeklyQuiz from './screens/AddWeeklyQuiz';
import AdminTaskLibrary from './screens/AdminTaskLibrary';
import AddTask from './screens/AddTask';
import AdminLeaderboard from './screens/AdminLeaderboard';
import AdminBadgeAvatar from './screens/AdminBadgeAvatar';
import AddAvatar from './screens/AddAvatar';
import AdminCommunityProgress from './screens/AdminCommunityProgress';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Initial check
    checkNetworkNow().then(setIsConnected);

    // Subscribe to changes
    const unsubscribe = subscribeToNetwork(setIsConnected);
    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SplashScreen"
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen
            name="SplashScreen"
            component={SplashScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="SignupScreen"
            component={SignupScreen}
          />
          <Stack.Screen
            name="Onboarding"
            component={Onboarding}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="OnboardingScreen"
            component={OnboardingScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="Calculator"
            component={Calculator}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="HomeScreen"
            component={MainTabs}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen
            name="ResultsScreen"
            component={ResultsScreen}
          />
          <Stack.Screen 
            name="EducationalScreen" 
            component={EducationalScreen}
          />
          <Stack.Screen 
            name="EducationalDetailScreen" 
            component={EducationalDetailScreen}
          />
          <Stack.Screen 
            name="EducationalQuizScreen" 
            component={EducationalQuizScreen}
          />
          <Stack.Screen 
            name="WeeklyQuizScreen" 
            component={WeeklyQuizScreen}
          />
          <Stack.Screen 
            name="InviteScreen" 
            component={InviteScreen}
          />
          <Stack.Screen 
            name="CommunityProgressScreen" 
            component={CommunityProgressScreen}
          />
          <Stack.Screen 
            name="CameraVerificationScreen" 
            component={CameraVerificationScreen}
          />
          <Stack.Screen 
            name="AdminDashboard"
            component={AdminDashboard}
          />
          <Stack.Screen 
            name="AdminUserManagement"
            options={{ gestureEnabled: false }}
          >
            {props => (
              <FilterProvider>
                <AdminUserManagement {...props} />
              </FilterProvider>
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="AdminEducationalMaterials"
            component={AdminEducationalMaterials}
          />
          <Stack.Screen 
            name="AddEducationalMaterial"
            component={AddEducationalMaterial}
          />
          <Stack.Screen 
            name="AdminWeeklyQuiz"
            component={AdminWeeklyQuiz}
          />
          <Stack.Screen 
            name="AddWeeklyQuiz"
            component={AddWeeklyQuiz}
          />
          <Stack.Screen 
            name="AdminTaskLibrary"
            component={AdminTaskLibrary}
          />
          <Stack.Screen
            name="AddTask"
            component={AddTask}
          />
          <Stack.Screen 
            name="AdminLeaderboard"
            component={AdminLeaderboard}
          />
          <Stack.Screen 
            name="AdminCommunityProgress"
            component={AdminCommunityProgress}
          />
          <Stack.Screen 
            name="AdminBadgeAvatar"
            component={AdminBadgeAvatar}
          />
          <Stack.Screen 
            name="AddAvatar"
            component={AddAvatar}
          />
          <Stack.Screen 
            name="TaskVerifyScreen"
            component={TaskVerifyScreen}
          />
          <Stack.Screen 
            name="VerifyTaskScreen"
            component={VerifyTaskScreen}
          />
          <Stack.Screen 
            name="SettingsScreen"
            component={SettingsScreen}
          />
        </Stack.Navigator>
        <NoInternetPopup
          visible={!isConnected}
          onRetry={() => checkNetworkNow().then(setIsConnected)}
        />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
