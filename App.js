import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext'; 
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
import AdminDashboard from './screens/AdminDashboard';
import AdminUserManagement from './screens/AdminUserManagement';
import AdminEducationalMaterials from './screens/AdminEducationalMaterials';
import AddEducationalMaterial from './screens/AddEducationalMaterial';
import AdminWeeklyQuiz from './screens/AdminWeeklyQuiz';
import AddWeeklyQuiz from './screens/AddWeeklyQuiz';
import AdminTaskLibrary from './screens/AdminTaskLibrary';
import AddTask from './screens/AddTask';

const Stack = createNativeStackNavigator();

const App = () => {
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
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
