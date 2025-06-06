// contexts/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load theme from AsyncStorage on app start
  useEffect(() => {
    loadTheme();
  }, []);
  
  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme from AsyncStorage:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save theme to AsyncStorage whenever it changes
  const saveTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme to AsyncStorage:', error);
    }
  };
  
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await saveTheme(newTheme);
  };

  // Function to clear theme (for logout)
  const clearTheme = async () => {
    try {
      await AsyncStorage.removeItem('theme');
      setTheme('light'); // Reset to default
    } catch (error) {
      console.error('Error clearing theme from AsyncStorage:', error);
    }
  };
  
  const colors = {
    light: {
      primary: '#4f46e5',
      background: '#ffffff',
      card: '#f8fafc',
      text: '#1e293b',
      border: '#e2e8f0',
      notification: '#ef4444',
      messageOutgoing: '#4f46e5',
      messageOutgoingText: '#ffffff',
      messageIncoming: '#f1f5f9',
      messageIncomingText: '#1e293b',
    },
    dark: {
      primary: '#6366f1',
      background: '#0f172a',
      card: '#1e293b',
      text: '#f8fafc',
      border: '#334155',
      notification: '#f87171',
      messageOutgoing: '#6366f1',
      messageOutgoingText: '#ffffff',
      messageIncoming: '#334155',
      messageIncomingText: '#f8fafc',
    },
  };
  
  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      clearTheme,
      colors: colors[theme],
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};