//App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from './contexts/ThemeContext';
import { SystemUIProvider } from './contexts/SystemUIContext';
import RootStack from './navigation/RootStack';

export default function App() {
  return (
    <ThemeProvider>
      <SystemUIProvider>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      </SystemUIProvider>
    </ThemeProvider>
  );
}
