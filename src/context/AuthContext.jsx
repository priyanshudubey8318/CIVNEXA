import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES } from '../constants/roles.js';
import authService from '../services/authService.js';
import { registerUnauthorizedHandler, clearAuthToken } from '../services/apiClient.js';

const AuthContext = createContext(null);

/**
 * Institutional Authentication Provider for CIVNEXA
 * Enforces real backend authentication, in-memory JWT tokens, and database role authority
 */
export const AuthProvider = ({
  children,
  defaultAuthenticated = null,
  initialUser = null,
}) => {
  // Support initialUser prop or test runner fixture
  const [currentUser, setCurrentUser] = useState(() => {
    if (initialUser) return initialUser;
    try {
      if (typeof window !== 'undefined') {
        const stored = window.sessionStorage.getItem('civnexa_current_user');
        if (stored) return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof defaultAuthenticated === 'boolean') {
      return defaultAuthenticated;
    }
    if (initialUser) return true;
    try {
      if (typeof window !== 'undefined') {
        const sessionActive = window.sessionStorage.getItem('civnexa_auth_session');
        const userStored = window.sessionStorage.getItem('civnexa_current_user');
        return Boolean(sessionActive === 'active' || userStored);
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Synchronize 401 Unauthorized API interceptor to clear auth state automatically
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearAuthToken();
      setCurrentUser(null);
      setIsAuthenticated(false);
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('civnexa_auth_session');
          window.sessionStorage.removeItem('civnexa_current_user');
        }
      } catch {
        // ignore
      }
    });
  }, []);

  /**
   * Authenticate against backend /api/v1/auth/login
   */
  const login = async ({ email, password }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await authService.login({ email, password });
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Log out and clear in-memory token & user state
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  /**
   * Role check helpers
   */
  const hasRole = (role) => {
    return currentUser?.role === role;
  };

  const hasAnyRole = (allowedRoles = []) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return Boolean(currentUser && allowedRoles.includes(currentUser.role));
  };

  const hasPermission = (allowedRoles) => {
    return hasAnyRole(allowedRoles);
  };

  const activeRoleConfig = currentUser?.role ? ROLES[currentUser.role] : null;

  const value = {
    isAuthenticated,
    currentUser,
    currentRole: activeRoleConfig || { key: '', label: 'Unauthenticated', description: '' },
    roles: ROLES,
    isLoading,
    authError,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    // 8 Institutional Role booleans based strictly on backend user profile
    isSuperAdmin: currentUser?.role === 'SUPER_ADMIN',
    isDean: currentUser?.role === 'DEAN',
    isHod: currentUser?.role === 'HOD',
    isFaculty: currentUser?.role === 'FACULTY',
    isStaff: currentUser?.role === 'STAFF',
    isCoordinator: currentUser?.role === 'COORDINATOR',
    isCommitteeMember: currentUser?.role === 'COMMITTEE_MEMBER',
    isStudent: currentUser?.role === 'STUDENT',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
