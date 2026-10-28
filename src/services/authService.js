// Mock Authentication Service for CIVNEXA Frontend (Phase FE-2)
// NOTE: This is a clearly identified demonstration and simulation service.
// Real institutional authentication and JWT verification will be implemented in the backend.

import { ROLES } from '../constants/roles.js';
import { MOCK_USERS } from '../constants/demoUsers.js';

const SESSION_KEY = 'civnexa_auth_session';
const USER_KEY = 'civnexa_current_user';
const TOKEN_KEY = 'civnexa_auth_token';

// Default demonstration password for all mock personas
export const DEMO_PASSWORD = 'Password@123';

export const authService = {
  /**
   * Get all available demo user credentials for rapid evaluation in the UI
   */
  getDemoCredentials: () => {
    return MOCK_USERS.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLabel: user.roleLabel,
      password: DEMO_PASSWORD,
      description: ROLES[user.role]?.description || '',
    }));
  },

  /**
   * Mock login implementation with validation and simulated delay
   */
  login: async ({ email, password, roleKey, rememberMe = false }) => {
    // Simulate slight asynchronous network latency (120ms)
    await new Promise((resolve) => setTimeout(resolve, 120));

    if (!email || !email.trim()) {
      throw new Error('Please enter your institutional email address.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid institutional email format (e.g., user@civnexa.edu).');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Match demo user by email or by explicit roleKey
    let matchedUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!matchedUser && roleKey) {
      matchedUser = MOCK_USERS.find((u) => u.role === roleKey);
    }

    // If still not matched, find closest or default to first valid user
    if (!matchedUser) {
      throw new Error(
        'Invalid demonstration credentials. Select one of the available demo personas below or use a registered @civnexa.edu address.'
      );
    }

    const sessionPayload = {
      user: matchedUser,
      token: `demo-jwt-token-${matchedUser.id}-${Date.now()}`,
      issuedAt: new Date().toISOString(),
      isDemo: true,
      rememberMe: Boolean(rememberMe),
    };

    // Store minimal demo session
    try {
      if (typeof window !== 'undefined') {
        const storage = rememberMe ? window.localStorage : window.sessionStorage;
        storage.setItem(SESSION_KEY, 'active');
        storage.setItem(USER_KEY, JSON.stringify(matchedUser));
        storage.setItem(TOKEN_KEY, sessionPayload.token);
      }
    } catch (e) {
      console.warn('Storage unavailable for demo session', e);
    }

    return sessionPayload;
  },

  /**
   * Clears the active demo session
   */
  logout: async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(SESSION_KEY);
        window.sessionStorage.removeItem(USER_KEY);
        window.sessionStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(SESSION_KEY);
        window.localStorage.removeItem(USER_KEY);
        window.localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Could not clear storage on logout', e);
    }
    return { success: true };
  },

  /**
   * Reads existing active session
   */
  getCurrentSession: () => {
    try {
      if (typeof window !== 'undefined') {
        const sessionActive =
          window.sessionStorage.getItem(SESSION_KEY) ||
          window.localStorage.getItem(SESSION_KEY);

        if (sessionActive === 'active') {
          const userRaw =
            window.sessionStorage.getItem(USER_KEY) ||
            window.localStorage.getItem(USER_KEY);

          if (userRaw) {
            return JSON.parse(userRaw);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse active user session', e);
    }
    return null;
  },

  /**
   * Demonstration password reset request
   */
  requestPasswordReset: async (email) => {
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (!email || !email.trim()) {
      throw new Error('Please provide an email address.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid institutional email format.');
    }

    return {
      success: true,
      email: email.trim(),
      message: 'Demonstration recovery request processed. (No real email dispatched in prototype mode).',
      mockResetUrl: '/reset-password?demo_token=mock-verify-12345',
    };
  },

  /**
   * Demonstration password reset confirmation
   */
  resetPassword: async ({ newPassword, confirmPassword }) => {
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    if (!/\d/.test(newPassword)) {
      throw new Error('Password must include at least one number.');
    }

    if (!/[A-Z]/.test(newPassword)) {
      throw new Error('Password must include at least one uppercase letter.');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    return {
      success: true,
      message: 'Demonstration password updated successfully. You may now sign in.',
    };
  },
};

export default authService;
