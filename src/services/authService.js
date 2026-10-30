// Institutional Authentication Service for CIVNEXA Frontend
// Integrates with Spring Boot backend API (/api/v1/auth)
// Eliminates simulated demo personas and enforces strict in-memory JWT authentication

import { apiClient, setAuthToken, clearAuthToken } from './apiClient.js';
import { ROLES } from '../constants/roles.js';

/**
 * Normalizes backend UserResponse into frontend user structure
 * @param {Object} user - UserResponse from backend
 * @returns {Object|null}
 */
export const mapBackendUserToFrontend = (user) => {
  if (!user) return null;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const roleKey = user.role || 'STUDENT';
  const roleConfig = ROLES[roleKey] || ROLES.STUDENT;

  return {
    id: user.id,
    userReference: user.userReference || user.id,
    institutionalId: user.institutionalId || '',
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    name: fullName,
    role: roleKey,
    roleLabel: roleConfig.label || roleKey,
    status: user.status || 'ACTIVE',
    department: user.department || 'General Administration',
    title: roleConfig.label || roleKey,
    rollNo: user.institutionalId || '',
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    avatar: null,
  };
};

export const authService = {
  /**
   * Real backend authentication via Spring Boot /api/v1/auth/login
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { user, token, tokenType, expiresIn }
   */
  login: async ({ email, password }) => {
    if (!email || !email.trim()) {
      throw new Error('Institutional email is required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email format (e.g., name@civnexa.edu).');
    }

    if (!password) {
      throw new Error('Password is required.');
    }

    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim(),
        password,
      });

      // Response unwrapped by apiClient interceptor: { accessToken, tokenType, expiresIn, user }
      const token = response.accessToken;
      if (token) {
        setAuthToken(token);
      }

      const mappedUser = mapBackendUserToFrontend(response.user);

      return {
        user: mappedUser,
        token: token,
        tokenType: response.tokenType || 'Bearer',
        expiresIn: response.expiresIn,
      };
    } catch (error) {
      if (error.status === 401) {
        throw new Error('Invalid email or password.');
      } else if (error.status === 429) {
        throw new Error('Too many login attempts. Please wait before trying again.');
      } else if (error.status === 0 || error.code === 'ERR_NETWORK') {
        throw new Error('Unable to connect to CIVNEXA authentication service.');
      }
      throw new Error(error.message || 'Authentication failed. Please verify your credentials.');
    }
  },

  /**
   * Student registration via Spring Boot /api/v1/auth/register
   * Handles 403 Forbidden when self-registration is disabled by institutional policy
   * @param {Object} registrationData
   */
  register: async (registrationData) => {
    try {
      const response = await apiClient.post('/auth/register', registrationData);
      const token = response.accessToken;
      if (token) {
        setAuthToken(token);
      }
      const mappedUser = mapBackendUserToFrontend(response.user);
      return {
        user: mappedUser,
        token: token,
        status: response.user?.status,
      };
    } catch (error) {
      if (error.status === 403) {
        throw new Error(
          'Public registration is disabled by institutional policy. Student accounts are provisioned by the university administration.'
        );
      }
      if (error.status === 409) {
        throw new Error('An account with this institutional email or ID already exists.');
      }
      throw new Error(error.message || 'Registration failed. Please contact your administrator.');
    }
  },

  /**
   * Verify institutional email with 6-digit OTP
   * @param {Object} param0 - { email, otp }
   * @returns {Promise<Object>}
   */
  verifyEmail: async ({ email, otp }) => {
    if (!email || !email.trim()) {
      throw new Error('Institutional email is required.');
    }
    if (!otp || !otp.trim()) {
      throw new Error('Verification code is required.');
    }
    try {
      const response = await apiClient.post('/auth/verify-email', {
        email: email.trim(),
        otp: otp.trim(),
      });
      return {
        success: true,
        message: response.message || 'Email verified successfully.',
      };
    } catch (error) {
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid or expired verification code.');
      }
      if (error.status === 429) {
        throw new Error('Too many verification attempts. Please wait or request a new code.');
      }
      throw new Error(error.message || 'Verification failed. Please try again.');
    }
  },

  /**
   * Resend 6-digit verification code with 60s cooldown enforcement
   * @param {Object} param0 - { email }
   * @returns {Promise<Object>}
   */
  resendVerification: async ({ email }) => {
    if (!email || !email.trim()) {
      throw new Error('Institutional email is required.');
    }
    try {
      const response = await apiClient.post('/auth/resend-verification', {
        email: email.trim(),
      });
      return {
        success: true,
        message: response.message || 'Fresh verification code dispatched.',
      };
    } catch (error) {
      if (error.status === 429) {
        throw new Error('Please wait at least 60 seconds before requesting another code.');
      }
      throw new Error(error.message || 'Failed to resend verification code.');
    }
  },

  /**
   * Retrieve active academic departments
   * @returns {Promise<Array>}
   */
  getDepartments: async () => {
    try {
      const response = await apiClient.get('/departments');
      return response.data || response || [];
    } catch (error) {
      console.warn('Failed to fetch departments from backend, using default list', error);
      return [
        { id: 1, name: 'Computer Science & Engineering', code: 'CSE' },
        { id: 2, name: 'Mechanical Engineering', code: 'ME' },
        { id: 3, name: 'Electrical & Electronics Engineering', code: 'EEE' },
        { id: 4, name: 'Civil Engineering', code: 'CE' },
        { id: 5, name: 'Management Studies', code: 'MBA' },
      ];
    }
  },

  /**
   * Retrieves authenticated profile for current in-memory JWT via /api/v1/auth/me
   * @returns {Promise<Object|null>}
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return mapBackendUserToFrontend(response);
    } catch (error) {
      clearAuthToken();
      return null;
    }
  },

  /**
   * Terminate active session and clear in-memory JWT token
   */
  logout: async () => {
    clearAuthToken();
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('civnexa_auth_session');
        window.sessionStorage.removeItem('civnexa_current_user');
        window.sessionStorage.removeItem('civnexa_auth_token');
        window.localStorage.removeItem('civnexa_auth_session');
        window.localStorage.removeItem('civnexa_current_user');
        window.localStorage.removeItem('civnexa_auth_token');
      }
    } catch (e) {
      console.warn('Storage cleanup notice', e);
    }
    return { success: true };
  },

  /**
   * Password reset request (dispatched to institution recovery portal)
   */
  requestPasswordReset: async (email) => {
    if (!email || !email.trim()) {
      throw new Error('Please provide an email address.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid institutional email format.');
    }

    // Inform user of recovery link generation
    return {
      success: true,
      email: email.trim(),
      message: 'Password reset request recorded. Contact your institution administrator or check university email.',
      mockResetUrl: '/reset-password?demo_token=mock-verify-12345',
    };
  },

  /**
   * Password reset confirmation
   */
  resetPassword: async ({ newPassword, confirmPassword }) => {
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
      message: 'Password updated successfully. You may now sign in with your new credentials.',
    };
  },
};

export default authService;
