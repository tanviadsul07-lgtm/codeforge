import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/common/ToastContainer';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ message, type = 'info', title = null, duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, title, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message, title = 'Success') => {
    return showToast({ message, type: 'success', title });
  }, [showToast]);

  const showError = useCallback((message, title = 'Error') => {
    return showToast({ message, type: 'error', title });
  }, [showToast]);

  const showWarning = useCallback((message, title = 'Warning') => {
    return showToast({ message, type: 'warning', title });
  }, [showToast]);

  const showInfo = useCallback((message, title = 'Notification') => {
    return showToast({ message, type: 'info', title });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
