import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnauthorizedPage from '../../pages/UnauthorizedPage';

/**
 * Route guard that validates whether the backend user's active role is permitted.
 * If unauthorized, renders the Access Denied (UnauthorizedPage) view.
 */
export const RequireRole = ({ allowedRoles = [] }) => {
  const { currentUser, currentRole } = useAuth();
  const roleKey = currentUser?.role || currentRole?.key;

  if (allowedRoles.length > 0 && (!roleKey || !allowedRoles.includes(roleKey))) {
    return <UnauthorizedPage />;
  }

  return <Outlet />;
};

export default RequireRole;
