// RootStack.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import AuthStack from './AuthStack';
import { useAuth } from '../contexts/AuthContext';

import ChatStack from './ChatStack';
import DMStack from './DMStack';
import GroupStack from './GroupsStack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'DirectMessageScreen') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Groups') {
            iconName = focused ? 'people' : 'people-outline';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        headerShown: false,
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          color: colors.text,
        },
      })}
    >
      <Tab.Screen name="Chats" component={ChatStack} />
      <Tab.Screen name="DirectMessageScreen" component={DMStack} options={{title:'Direct Message'}} />
      <Tab.Screen name="Groups" component={GroupStack} />
    </Tab.Navigator>
  );
};

const RootNavigation = () => {
  const { isLoggedIn } = useAuth();
  const { colors } = useTheme();

  // Show loading screen while checking authentication status
  if (isLoggedIn === null) {
    return (
      <SafeAreaProvider>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: colors.background 
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          // User is logged in - show main app
          <Stack.Screen 
            name="Main" 
            component={TabNavigator} 
            options={{
              headerShown: false,
              // Prevent going back to auth stack
              gestureEnabled: false,
            }} 
          />
        ) : (
          // User is not logged in - show auth stack
          <Stack.Screen 
            name="AuthStack" 
            component={AuthStack} 
            options={{
              headerShown: false,
              // Prevent going back when not authenticated
              gestureEnabled: false,
            }} 
          />
        )}
      </Stack.Navigator>
    </SafeAreaProvider>
  );
};

export default RootNavigation;