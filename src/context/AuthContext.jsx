import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES } from '../constants/roles.js';
import { MOCK_USERS } from '../constants/demoUsers.js';
import authService from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, defaultAuthenticated = null }) => {
  // Determine initial authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof defaultAuthenticated === 'boolean') {
      return defaultAuthenticated;
    }
    const session = authService.getCurrentSession();
    return Boolean(session);
  });

  // Current authenticated user persona
  const [currentUser, setCurrentUser] = useState(() => {
    const existing = authService.getCurrentSession();
    if (existing) {
      const match = MOCK_USERS.find((u) => u.id === existing.id || u.role === existing.role);
      if (match) return match;
    }
    // Default fallback to Dean for administrative demonstration
    return MOCK_USERS[1];
  });

  // Keep sessionStorage in sync when switching user
  const syncSessionUser = useCallback((user) => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('civnexa_current_user', JSON.stringify(user));
        window.sessionStorage.setItem('civnexa_demo_user_id', user.id);
      }
    } catch (e) {
      console.warn('Storage sync failed', e);
    }
  }, []);

  const login = async ({ email, password, roleKey, rememberMe = false }) => {
    const result = await authService.login({ email, password, roleKey, rememberMe });
    setCurrentUser(result.user);
    setIsAuthenticated(true);
    syncSessionUser(result.user);
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  const switchRole = (roleKey) => {
    const targetUser = MOCK_USERS.find((u) => u.role === roleKey);
    if (targetUser) {
      setCurrentUser(targetUser);
      syncSessionUser(targetUser);
    }
  };

  const switchUser = (userId) => {
    const targetUser = MOCK_USERS.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
      syncSessionUser(targetUser);
    }
  };

  const hasPermission = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(currentUser.role);
  };

  const value = {
    isAuthenticated,
    currentUser,
    currentRole: ROLES[currentUser.role] || ROLES.DEAN,
    roles: ROLES,
    allUsers: MOCK_USERS,
    login,
    logout,
    switchRole,
    switchUser,
    hasPermission,
    isDemoAuth: true,
    // Role check helpers
    isSuperAdmin: currentUser.role === 'SUPER_ADMIN',
    isDean: currentUser.role === 'DEAN',
    isHod: currentUser.role === 'HOD',
    isFaculty: currentUser.role === 'FACULTY',
    isStaff: currentUser.role === 'STAFF',
    isCoordinator: currentUser.role === 'COORDINATOR',
    isCommitteeMember: currentUser.role === 'COMMITTEE_MEMBER',
    isStudent: currentUser.role === 'STUDENT',
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
