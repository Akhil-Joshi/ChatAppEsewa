import React, { createContext, useContext, useEffect } from 'react';
import { StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

const SystemUIContext = createContext();

export const SystemUIProvider = ({ children }) => {
  useEffect(() => {
    const hideNavBar = async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
        console.log('Navigation bar hidden');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
        // await NavigationBar.setBackgroundColorAsync('#000'); // Transparent
      } catch (error) {
        console.error('Error hiding navigation bar:', error);
      }
    };

    hideNavBar();
  }, []);

  return (
    <SystemUIContext.Provider value={{}}>
      <StatusBar
        barStyle="default"
        backgroundColor="#1F4B43"
        hidden={true}
      />
      {children}
    </SystemUIContext.Provider>
  );
};

export const useSystemUI = () => useContext(SystemUIContext);
