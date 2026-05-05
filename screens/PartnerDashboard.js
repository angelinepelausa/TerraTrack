import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { scale, vScale } from '../utils/scaling';
import VoucherStatsScreen from './VoucherStatsScreen';
import ManualVerificationScreen from './ManualVerificationScreen';
import PartnerProfileScreen from './PartnerProfileScreen';

const Tab = createBottomTabNavigator();

export default function PartnerDashboard() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#415D43',
          height: vScale(80),
          position: 'relative',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarLabelStyle: { 
          fontSize: scale(12),
          fontFamily: 'DMSans-Bold',
        },
      }}
    >
      <Tab.Screen
        name="Vouchers"
        component={VoucherStatsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: '-30%',
                    height: scale(2),
                    width: '175%',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
              <Ionicons 
                name="stats-chart" 
                size={scale(24)} 
                color="#FFFFFF" 
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Verify"
        component={ManualVerificationScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: scale(-10) }}>
              <View
                style={{
                  backgroundColor: focused ? '#FFFFFF' : '#709775',
                  width: scale(60),
                  height: scale(60),
                  borderRadius: scale(30),
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={scale(28)} 
                  color={focused ? '#709775' : '#FFFFFF'} 
                />
              </View>
            </View>
          ),
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={PartnerProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: '-30%',
                    height: scale(2),
                    width: '175%',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              )}
              <Ionicons 
                name="business" 
                size={scale(24)} 
                color="#FFFFFF" 
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}