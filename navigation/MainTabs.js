import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import RoutineScreen from '../screens/RoutineScreen';
import LeaderboardsScreen from '../screens/LeaderboardsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#415D43',
          height: 80,
          position: 'relative',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: '-30%',
                    height: 2,
                    width: '175%',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
              <Image
                source={require('../assets/icons/home.png')}
                style={{ width: 24, height: 24, tintColor: '#FFFFFF' }}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Routine"
        component={RoutineScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: '-30%',
                    height: 2,
                    width: '175%',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
              <Image
                source={require('../assets/icons/routine.png')}
                style={{ width: 24, height: 24, tintColor: '#FFFFFF' }}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Leaderboards"
        component={LeaderboardsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: '-30%',
                    height: 2,
                    width: '175%',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
              <Image
                source={require('../assets/icons/leaderboard.png')}
                style={{ width: 24, height: 24, tintColor: '#FFFFFF' }}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: '-30%',
                    height: 2,
                    width: '175%',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
              <Image
                source={require('../assets/icons/profile.png')}
                style={{ width: 24, height: 24, tintColor: '#FFFFFF' }}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
