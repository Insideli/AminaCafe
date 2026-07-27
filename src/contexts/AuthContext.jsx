import React, { createContext, useState } from 'react';
import { useDeviceStorage } from '../hooks/useDeviceStorage';
import AuthService from '../services/AuthService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Те самые стейты, которые раньше загромождали App.jsx
  const [currentUser, setCurrentUser] = useDeviceStorage('amina_current_user_device', { 
    role: 'guest', phone: '', name: '', station: null, isSenior: false, sessionToken: null 
  }); 
  const [lang, setLang] = useDeviceStorage('amina_lang_device', 'ru');
  
  const isAuthenticated = !!currentUser?.phone;

  // Обертки над сервисами для удобного использования в интерфейсе
  const loginStaff = (phone, password, rolesData) => {
    const { user, updatedStaffData } = AuthService.loginStaff(phone, password, rolesData, lang);
    setCurrentUser(user);
    return updatedStaffData; 
  };

  const loginGuest = async (customersData) => {
    const { user, updatedCustomerData, userId } = await AuthService.loginGuest(customersData);
    setCurrentUser(user);
    return { updatedCustomerData, userId };
  };

  const logout = async () => {
    await AuthService.logout();
    setCurrentUser({ role: 'guest', phone: '', name: '', station: null, sessionToken: null });
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
      isAuthenticated,
      lang,
      setLang,
      loginStaff,
      loginGuest,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

