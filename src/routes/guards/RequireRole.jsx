import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnauthorizedPage from '../../pages/UnauthorizedPage';

/**
 * Route guard that validates whether the current demo role is permitted.
 * If unauthorized, renders the Access Denied (UnauthorizedPage) view.
 */
export const RequireRole = ({ allowedRoles = [] }) => {
  const { currentRole } = useAuth();

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole.key)) {
    return <UnauthorizedPage />;
  }

  return <Outlet />;
};

export default RequireRole;
