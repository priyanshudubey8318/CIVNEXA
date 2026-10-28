import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route wrapper for guest-only authentication pages (Login, Forgot Password, Reset Password).
 * If the user already has an active demonstration session, redirects them to the overview dashboard.
 */
export const PublicOnlyRoute = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
