// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  const login = async (token) => {
    await AsyncStorage.setItem('@access_token', token);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([
      '@user_id',
      '@email',
      '@full_name',
      // '@last_name',
      '@phone',
      '@bio',
      '@access_token',
      '@refresh_token'
    ]);

    setIsLoggedIn(false);

    const values = await AsyncStorage.multiGet([
      '@user_id',
      '@email',
      '@full_name',
      '@access_token',
      '@refresh_token',
    ]);

    console.log('Stored values in async storage after logout ....:', values);

  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('@access_token');
      setIsLoggedIn(!!token);
    };
    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);