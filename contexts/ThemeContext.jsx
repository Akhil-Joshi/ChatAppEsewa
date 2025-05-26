// contexts/ThemeContext.js
import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
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
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: colors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};
