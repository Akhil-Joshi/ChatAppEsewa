//App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from './contexts/ThemeContext';
import { SystemUIProvider } from './contexts/SystemUIContext';
import RootStack from './navigation/RootStack';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <ThemeProvider>
      <SystemUIProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootStack />
          </NavigationContainer>
        </AuthProvider>
      </SystemUIProvider>
    </ThemeProvider>
  );
}
