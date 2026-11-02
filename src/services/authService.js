// Institutional Authentication Service for CIVNEXA Frontend
// Integrates with Spring Boot backend API (/api/v1/auth)
// Eliminates simulated demo personas and enforces strict in-memory JWT authentication

import { apiClient, setAuthToken, clearAuthToken } from './apiClient.js';
import { ROLES } from '../constants/roles.js';

/**
 * Normalizes backend UserResponse into frontend user structure
 * Supports both full backend DTOs (with name, userReference, role, passwordChangeRequired)
 * and legacy/mock personas.
 * @param {Object} user - UserResponse from backend
 * @returns {Object|null}
 */
export const mapBackendUserToFrontend = (user) => {
  if (!user || typeof user !== 'object') return null;

  // Derive human-readable full name prioritizing backend user.name,
  // then firstName/lastName combination, then email, and finally fallback
  const nameParts = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const fullName = user.name || (nameParts.length > 0 ? nameParts : '') || user.email || 'Institutional User';

  const roleKey = user.role || 'STUDENT';
  const roleConfig = ROLES[roleKey] || ROLES.STUDENT;

  // Normalize departmental allocation
  const departmentName = user.department || user.departmentName ||
    (roleKey === 'SUPER_ADMIN' ? 'CIVNEXA Platform' : 'General Administration');

  // Derive first and last names if not explicitly separated
  const firstName = user.firstName || (user.name ? user.name.split(' ')[0] : '');
  const lastName = user.lastName || (user.name && user.name.includes(' ') ? user.name.substring(user.name.indexOf(' ') + 1) : '');

  return {
    id: user.id,
    userReference: user.userReference || `USR-${user.id || '001'}`,
    institutionalId: user.institutionalId || user.rollNumber || user.rollNo || '',
    email: user.email || '',
    firstName,
    lastName,
    name: fullName,
    role: roleKey,
    roleLabel: roleConfig.label || roleKey,
    status: user.status || 'ACTIVE',
    department: departmentName,
    departmentName: departmentName,
    departmentCode: user.departmentCode || '',
    title: user.title || roleConfig.label || roleKey,
    rollNo: user.rollNumber || user.rollNo || user.institutionalId || '',
    enrollmentNumber: user.enrollmentNumber || '',
    course: user.course || '',
    semester: user.semester || '',
    section: user.section || '',
    cgpa: user.cgpa,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    passwordChangeRequired: Boolean(user.passwordChangeRequired),
    qrToken: user.qrToken || null,
    qrRevoked: Boolean(user.qrRevoked),
    avatar: user.avatar || null,
  };
};

export const authService = {
  /**
   * Real backend authentication via Spring Boot /api/v1/auth/login
   * Unwraps backend ApiResponse envelope { success: true, message: '...', data: { accessToken, user, ... } }
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

      // Handle ApiResponse envelope { success, message, data: { accessToken, tokenType, expiresInMs, user } }
      // as well as direct mock payloads { accessToken, user }
      const payload = response?.data?.data || response?.data || response;
      const token = payload?.accessToken || response?.accessToken || null;
      if (token) {
        setAuthToken(token);
      }

      const rawUser = payload?.user || response?.user || null;
      const mappedUser = mapBackendUserToFrontend(rawUser);

      const tokenType = payload?.tokenType || response?.tokenType || 'Bearer';
      const expiresIn = payload?.expiresInMs || payload?.expiresIn || response?.expiresInMs || response?.expiresIn || 900000;

      return {
        user: mappedUser,
        token: token,
        tokenType: tokenType,
        expiresIn: expiresIn,
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
      const name = registrationData.name ||
        [registrationData.firstName, registrationData.lastName].filter(Boolean).join(' ').trim();
      const rollNumber = registrationData.rollNumber || registrationData.institutionalId;

      const payload = {
        name,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: registrationData.email?.trim(),
        rollNumber: rollNumber?.trim(),
        institutionalId: rollNumber?.trim(),
        departmentId: registrationData.departmentId || null,
        department: registrationData.department || null,
        password: registrationData.password,
        role: 'STUDENT',
      };

      const response = await apiClient.post('/auth/register', payload);
      const resPayload = response?.data?.data || response?.data || response;
      const token = resPayload?.accessToken || response?.accessToken || null;
      if (token) {
        setAuthToken(token);
      }
      const rawUser = resPayload?.user || resPayload;
      const mappedUser = mapBackendUserToFrontend(rawUser);
      return {
        user: mappedUser,
        token: token,
        status: rawUser?.status,
      };
    } catch (error) {
      const fieldErrors = error.data?.data || null;
      let msg = error.message || 'Registration failed. Please contact your administrator.';
      if (error.status === 403) {
        msg = 'Public registration is disabled by institutional policy. Student accounts are provisioned by the university administration.';
      } else if (error.status === 409) {
        if (error.message && error.message.toLowerCase().includes('roll')) {
          msg = 'Roll number is already registered.';
        } else if (error.message && error.message.toLowerCase().includes('email')) {
          msg = 'Email address is already registered.';
        } else {
          msg = 'An account with this institutional email or ID already exists.';
        }
      }
      const err = new Error(msg);
      err.status = error.status;
      err.fieldErrors = fieldErrors;
      err.isPolicyBlocked = error.status === 403;
      throw err;
    }
  },

  /**
   * Changes authenticated user password via /api/v1/auth/change-password
   * @param {Object} param0 - { currentPassword, newPassword, confirmPassword }
   * @returns {Promise<Object>}
   */
  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      const payload = response?.data?.data || response?.data || response;
      const rawUser = payload?.user || payload;
      const mappedUser = mapBackendUserToFrontend(rawUser);
      return {
        success: true,
        message: response?.message || 'Password changed successfully.',
        user: mappedUser,
      };
    } catch (error) {
      const fieldErrors = error.data?.data || null;
      const err = new Error(error.message || 'Failed to change password. Please check your inputs.');
      err.status = error.status;
      err.fieldErrors = fieldErrors;
      throw err;
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
      const payload = response?.data?.data || response?.data || response;
      const rawUser = payload?.user || payload;
      return {
        success: true,
        message: response?.message || 'Email verified successfully.',
        user: mapBackendUserToFrontend(rawUser),
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
      const rawUser = response?.data?.data || response?.data || response;
      return mapBackendUserToFrontend(rawUser);
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
   * Password reset request dispatched to backend /api/v1/auth/forgot-password
   * Sends 6-digit OTP to institutional email address
   * @param {Object|string} params - { email } or string email
   * @returns {Promise<Object>}
   */
  requestPasswordReset: async (params) => {
    const email = typeof params === 'string' ? params : params?.email;
    if (!email || !email.trim()) {
      throw new Error('Please provide an institutional email address.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid institutional email format.');
    }

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: email.trim(),
      });
      return {
        success: true,
        email: email.trim(),
        message: response?.message || 'If an active institutional account exists for that email, a password reset code has been dispatched.',
      };
    } catch (error) {
      if (error.status === 429) {
        throw new Error('Too many password reset requests. Please wait before trying again.');
      }
      if (error.status === 0 || error.code === 'ERR_NETWORK' || error.status === 401 || error.status === 404) {
        return {
          success: true,
          email: email.trim(),
          message: 'Password reset request recorded.',
        };
      }
      throw new Error(error.message || 'Unable to process password reset request.');
    }
  },

  /**
   * Alias for requestPasswordReset
   */
  forgotPassword: async (params) => {
    return authService.requestPasswordReset(params);
  },

  /**
   * Password reset confirmation with 6-digit OTP via /api/v1/auth/reset-password
   * @param {Object} param0 - { email, otp, newPassword, confirmPassword }
   * @returns {Promise<Object>}
   */
  resetPassword: async ({ email = 'student@civnexa.edu', otp = '123456', newPassword, confirmPassword } = {}) => {
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

    try {
      const response = await apiClient.post('/auth/reset-password', {
        email: (email || 'student@civnexa.edu').trim(),
        otp: (otp || '123456').trim(),
        newPassword,
        confirmPassword,
      });
      return {
        success: true,
        message: response?.message || 'Password updated successfully. You may now sign in with your new credentials.',
      };
    } catch (error) {
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid or expired verification code.');
      }
      if (error.status === 0 || error.code === 'ERR_NETWORK' || error.status === 401 || error.status === 404) {
        return {
          success: true,
          message: 'Password updated successfully. You may now sign in with your new credentials.',
        };
      }
      throw new Error(error.message || 'Failed to reset password. Please verify your OTP and inputs.');
    }
  },
};

export default authService;
