import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { ToastProvider } from '../context/ToastContext';

export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
};
