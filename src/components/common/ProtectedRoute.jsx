import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from './LoadingState';
import { ROLES } from '../../utils/constants';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState message="Verifying authentication session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect user to their own role dashboard if unauthorized for target route
    if (role === ROLES.FIELD_OPERATOR) return <Navigate to="/operator/dashboard" replace />;
    if (role === ROLES.DEPARTMENT_OFFICER) return <Navigate to="/department/dashboard" replace />;
    return <Navigate to="/citizen/dashboard" replace />;
  }

  return children;
};
