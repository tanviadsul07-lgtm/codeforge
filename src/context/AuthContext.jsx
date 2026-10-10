import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(ROLES.CITIZEN);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const initAuth = useCallback(() => {
    setLoading(true);
    setAuthError(null);

    const unsubscribe = authService.onAuthChange((authData) => {
      try {
        if (authData && authData.firebaseUser) {
          const { firebaseUser, profile } = authData;
          setIsAuthenticated(true);
          const activeRole = profile?.role || ROLES.CITIZEN;
          setRole(activeRole);
          setUser({
            uid: firebaseUser.uid,
            name: profile?.displayName || firebaseUser.displayName || 'PathRakshak User',
            email: firebaseUser.email,
            role: activeRole,
            avatar: profile?.avatar || profile?.photoURL || firebaseUser.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            phone: profile?.phoneNumber || profile?.phone || '+91 98765 43210'
          });
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setRole(ROLES.CITIZEN);
        }
      } catch (err) {
        console.error('[AuthContext Exception] Error processing auth state change:', err);
        setAuthError(err.message || 'Authentication session resolution failed.');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // ALWAYS ALWAYS UNBLOCK LOADING STATE
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [initAuth]);

  // Safe retry trigger for authentication state resolution
  const retryAuth = () => {
    initAuth();
  };

  const switchRole = (newRole) => {
    setRole(newRole);
    if (user) {
      setUser(prev => ({ ...prev, role: newRole }));
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.success) {
        setIsAuthenticated(true);
        const userRole = res.profile?.role || ROLES.CITIZEN;
        setRole(userRole);
        setUser({
          uid: res.user.uid,
          name: res.profile?.displayName || res.user.displayName || 'PathRakshak User',
          email: res.user.email,
          role: userRole,
          avatar: res.profile?.avatar || res.profile?.photoURL || res.user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        });
        return res;
      }
      return res;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.register(userData);
      if (res.success) {
        setIsAuthenticated(true);
        setRole(ROLES.CITIZEN);
        setUser({
          uid: res.user.uid,
          name: res.profile?.displayName || userData.fullName || 'Citizen Contributor',
          email: res.user.email,
          role: ROLES.CITIZEN
        });
        return res;
      }
      return res;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.warn('[Logout Warning]', err.message);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setRole(ROLES.CITIZEN);
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  const updateProfile = async (updatedFields) => {
    if (user?.uid) {
      await authService.updateUserProfile(user.uid, updatedFields);
    }
    const updated = { ...user, ...updatedFields };
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAuthenticated,
      loading,
      authError,
      retryAuth,
      login,
      signup,
      logout,
      resetPassword,
      switchRole,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
