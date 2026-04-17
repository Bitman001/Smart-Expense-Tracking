import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';
import { useStore } from '../stores/useStore';

import HomeScreen from '../screens/HomeScreen';
import AddScreen from '../screens/AddScreen';
import StatsScreen from '../screens/StatsScreen';
import FamilyScreen from '../screens/FamilyScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: '🏠', inactive: '🏡' },
  Add: { active: '➕', inactive: '➕' },
  Stats: { active: '📊', inactive: '📈' },
  Family: { active: '👨‍👩‍👧‍👦', inactive: '👥' },
  Settings: { active: '⚙️', inactive: '🔧' },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name] || { active: '📌', inactive: '📌' };
          return (
            <Text style={{ fontSize: route.name === 'Add' ? 28 : 22 }}>
              {focused ? icons.active : icons.inactive}
            </Text>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 0,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
          shadowColor: '#6C5CE7',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '首页' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: '统计' }} />
      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          tabBarLabel: '记账',
          tabBarIconStyle: {
            backgroundColor: COLORS.primary,
            width: 52,
            height: 52,
            borderRadius: 26,
            marginTop: -20,
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      />
      <Tab.Screen name="Family" component={FamilyScreen} options={{ tabBarLabel: '家庭' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: '设置' }} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingLogo}>🧾</Text>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>加载中...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { user, isLoading, loadSession } = useStore();

  useEffect(() => {
    loadSession();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingLogo: {
    fontSize: 64,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
});
