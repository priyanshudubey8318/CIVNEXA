import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  apiClient,
  apiService,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  registerUnauthorizedHandler,
  API_BASE_URL,
} from '../services/apiClient';
import { authService, mapBackendUserToFrontend } from '../services/authService';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import SettingsPage from '../pages/SettingsPage';
import RequireAuth from '../routes/guards/RequireAuth';
import RequireRole from '../routes/guards/RequireRole';
import UnauthorizedPage from '../pages/UnauthorizedPage';

describe('CIVNEXA BE-1.3-D Authentication Integration Tests', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    clearAuthToken();
    vi.restoreAllMocks();
  });

  // ----------------------------------------------------
  // 1. API Client Tests
  // ----------------------------------------------------
  describe('1. API Client (apiClient & apiService)', () => {
    it('verifies default base URL configuration', () => {
      expect(API_BASE_URL).toMatch(/localhost:8080\/api\/v1|\/api\/v1/);
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('manages strictly in-memory token state (set, get, clear)', () => {
      expect(getAuthToken()).toBeNull();

      setAuthToken('sample-jwt-token-xyz');
      expect(getAuthToken()).toBe('sample-jwt-token-xyz');

      clearAuthToken();
      expect(getAuthToken()).toBeNull();
    });

    it('attaches Authorization header when in-memory token exists, and omits it when null', async () => {
      const requestInterceptor = apiClient.interceptors.request.handlers[0].fulfilled;

      // When token is null
      clearAuthToken();
      const configWithoutToken = requestInterceptor({ headers: {} });
      expect(configWithoutToken.headers.Authorization).toBeUndefined();

      // When token is set
      setAuthToken('test-bearer-token-123');
      const configWithToken = requestInterceptor({ headers: {} });
      expect(configWithToken.headers.Authorization).toBe('Bearer test-bearer-token-123');
    });

    it('response interceptor unwraps data payload successfully', async () => {
      const responseInterceptor = apiClient.interceptors.response.handlers[0].fulfilled;
      const fakeAxiosResponse = {
        data: { accessToken: 'token-abc', user: { id: 'u1' } },
        status: 200,
        statusText: 'OK',
      };
      const result = responseInterceptor(fakeAxiosResponse);
      expect(result).toEqual({ accessToken: 'token-abc', user: { id: 'u1' } });
    });

    it('response interceptor triggers unauthorized handler and normalizes error on 401', async () => {
      const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
      const unauthorizedMock = vi.fn();
      registerUnauthorizedHandler(unauthorizedMock);

      const fakeError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      };

      await expect(errorInterceptor(fakeError)).rejects.toMatchObject({
        status: 401,
        message: 'Invalid credentials',
        isApiError: true,
      });

      expect(unauthorizedMock).toHaveBeenCalledTimes(1);
    });

    it('normalizes network errors when backend is unreachable', async () => {
      const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;
      const fakeNetworkError = {
        code: 'ERR_NETWORK',
        message: 'Network Error',
      };

      await expect(errorInterceptor(fakeNetworkError)).rejects.toMatchObject({
        status: 0,
        message: 'Unable to connect to CIVNEXA authentication service.',
        isApiError: true,
      });
    });
  });

  // ----------------------------------------------------
  // 2. Authentication Service Tests
  // ----------------------------------------------------
  describe('2. Authentication Service (authService)', () => {
    it('login sends payload to /auth/login, sets in-memory token and returns mapped user', async () => {
      const mockBackendUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userReference: 'USR-DEAN-001',
        institutionalId: 'INST-D-101',
        email: 'dean@civnexa.edu',
        role: 'DEAN',
        status: 'ACTIVE',
        firstName: 'Ananya',
        lastName: 'Sen',
        department: 'Academic Affairs',
        createdAt: '2026-01-01T00:00:00Z',
      };

      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        accessToken: 'jwt-dean-token-xyz',
        tokenType: 'Bearer',
        expiresIn: 3600000,
        user: mockBackendUser,
      });

      const result = await authService.login({
        email: 'dean@civnexa.edu',
        password: 'ValidPassword@123',
      });

      expect(postSpy).toHaveBeenCalledWith('/auth/login', {
        email: 'dean@civnexa.edu',
        password: 'ValidPassword@123',
      });
      expect(getAuthToken()).toBe('jwt-dean-token-xyz');
      expect(result.user.name).toBe('Ananya Sen');
      expect(result.user.role).toBe('DEAN');
      expect(result.user.roleLabel).toBe('Dean / Central Admin');
    });

    it('successfully processes login with nested backend response envelope { success, message, data: { accessToken, user } }', async () => {
      const nestedBackendResponse = {
        success: true,
        message: 'Authentication successful',
        data: {
          accessToken: 'jwt-super-admin-token-999',
          tokenType: 'Bearer',
          expiresInMs: 900000,
          user: {
            id: 1,
            email: 'admin@civnexa.edu',
            name: 'Platform Administrator',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            userReference: 'ADM-ROOT-001',
            passwordChangeRequired: true,
          },
        },
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(nestedBackendResponse);

      const result = await authService.login({
        email: 'admin@civnexa.edu',
        password: 'ValidPassword@123',
      });

      expect(getAuthToken()).toBe('jwt-super-admin-token-999');
      expect(result.token).toBe('jwt-super-admin-token-999');
      expect(result.user).not.toBeNull();
      expect(result.user.name).toBe('Platform Administrator');
      expect(result.user.role).toBe('SUPER_ADMIN');
      expect(result.user.roleLabel).toBe('Super Admin');
      expect(result.user.userReference).toBe('ADM-ROOT-001');
      expect(result.user.passwordChangeRequired).toBe(true);
      expect(result.user.firstName).toBe('Platform');
      expect(result.user.lastName).toBe('Administrator');
    });

    it('handles null or missing user payload safely in mapBackendUserToFrontend', () => {
      expect(mapBackendUserToFrontend(null)).toBeNull();
      expect(mapBackendUserToFrontend(undefined)).toBeNull();
      expect(mapBackendUserToFrontend({})).toEqual(
        expect.objectContaining({
          role: 'STUDENT',
          name: 'Institutional User',
          status: 'ACTIVE',
        })
      );
    });

    it('register captures 403 Forbidden and surfaces clear institutional policy notice', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
        status: 403,
        message: 'Self-registration disabled',
      });

      await expect(
        authService.register({
          email: 'student@civnexa.edu',
          password: 'Password@123',
          firstName: 'Rohan',
          lastName: 'Verma',
          institutionalId: '22CSE099',
        })
      ).rejects.toThrow(
        /Public registration is disabled by institutional policy/
      );
    });

    it('getCurrentUser retrieves authenticated user profile via /auth/me', async () => {
      const mockBackendUser = {
        id: 'uuid-hod-01',
        userReference: 'USR-HOD-01',
        institutionalId: 'INST-H-01',
        email: 'hod.cse@civnexa.edu',
        role: 'HOD',
        status: 'ACTIVE',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        department: 'Computer Science',
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockBackendUser);

      const user = await authService.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user.role).toBe('HOD');
      expect(user.name).toBe('Rajesh Kumar');
    });

    it('logout clears in-memory token and storage', async () => {
      setAuthToken('token-to-clear');
      expect(getAuthToken()).toBe('token-to-clear');

      await authService.logout();
      expect(getAuthToken()).toBeNull();
    });
  });

  // ----------------------------------------------------
  // 3. AuthContext Tests
  // ----------------------------------------------------
  describe('3. AuthContext State & Roles', () => {
    const TestConsumer = () => {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="auth-status">{auth.isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
          <span data-testid="user-role">{auth.currentUser?.role || 'NONE'}</span>
          <span data-testid="user-name">{auth.currentUser?.name || 'NONE'}</span>
          <span data-testid="is-super-admin">{auth.isSuperAdmin ? 'yes' : 'no'}</span>
          <span data-testid="is-dean">{auth.isDean ? 'yes' : 'no'}</span>
          <span data-testid="is-student">{auth.isStudent ? 'yes' : 'no'}</span>
          <span data-testid="password-change">{auth.passwordChangeRequired ? 'yes' : 'no'}</span>
          <button onClick={() => auth.login({ email: 'dean@civnexa.edu', password: 'Password@123' }).catch(() => {})}>
            Trigger Login
          </button>
          <button onClick={() => auth.login({ email: 'admin@civnexa.edu', password: 'SuperAdminPassword@123' }).catch(() => {})}>
            Trigger Super Admin Login
          </button>
          <button onClick={() => auth.logout()}>Trigger Logout</button>
        </div>
      );
    };

    it('initializes in unauthenticated state with null user', () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
      expect(screen.getByTestId('user-role').textContent).toBe('NONE');
    });

    it('login transitions state and updates role helpers', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        accessToken: 'jwt-dean-token',
        user: {
          id: 'dean-id',
          userReference: 'USR-DEAN',
          email: 'dean@civnexa.edu',
          role: 'DEAN',
          status: 'ACTIVE',
          firstName: 'Ananya',
          lastName: 'Sen',
        },
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Login' }));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
        expect(screen.getByTestId('user-role').textContent).toBe('DEAN');
        expect(screen.getByTestId('is-dean').textContent).toBe('yes');
        expect(screen.getByTestId('is-student').textContent).toBe('no');
      });

      // Test logout
      fireEvent.click(screen.getByRole('button', { name: 'Trigger Logout' }));
      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
        expect(screen.getByTestId('user-role').textContent).toBe('NONE');
      });
    });

    it('login with nested SUPER_ADMIN envelope correctly updates user.name, role, and isSuperAdmin', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        message: 'Authentication successful',
        data: {
          accessToken: 'jwt-superadmin-token-111',
          tokenType: 'Bearer',
          expiresInMs: 900000,
          user: {
            id: 1,
            email: 'admin@civnexa.edu',
            name: 'Platform Administrator',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            userReference: 'ADM-ROOT-001',
            passwordChangeRequired: true,
          },
        },
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Super Admin Login' }));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('authenticated');
        expect(screen.getByTestId('user-role').textContent).toBe('SUPER_ADMIN');
        expect(screen.getByTestId('user-name').textContent).toBe('Platform Administrator');
        expect(screen.getByTestId('is-super-admin').textContent).toBe('yes');
        expect(screen.getByTestId('is-dean').textContent).toBe('no');
        expect(screen.getByTestId('password-change').textContent).toBe('yes');
      });
    });

    it('rejects login when backend response contains null user', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: false,
        message: 'Invalid user',
        data: null,
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Trigger Login' }));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
        expect(screen.getByTestId('user-role').textContent).toBe('NONE');
      });
    });
  });

  // ----------------------------------------------------
  // 4. Route Guards Tests
  // ----------------------------------------------------
  describe('4. Route Guards (RequireAuth & RequireRole)', () => {
    const GuardedApp = ({ initialUser = null, defaultAuthenticated = false }) => (
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider initialUser={initialUser} defaultAuthenticated={defaultAuthenticated}>
          <Routes>
            <Route path="/login" element={<div>Login Page View</div>} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/protected" element={<RequireRole allowedRoles={['DEAN', 'SUPER_ADMIN']} />}>
                <Route index element={<div>Protected Dean Workspace</div>} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    it('redirects unauthenticated user to /login', () => {
      render(<GuardedApp initialUser={null} defaultAuthenticated={false} />);
      expect(screen.getByText('Login Page View')).toBeDefined();
    });

    it('permits authorized role to access protected route', () => {
      const deanUser = {
        id: 'u-dean',
        role: 'DEAN',
        name: 'Dean Sen',
        email: 'dean@civnexa.edu',
      };
      render(<GuardedApp initialUser={deanUser} defaultAuthenticated={true} />);
      expect(screen.getByText('Protected Dean Workspace')).toBeDefined();
    });

    it('redirects unauthorized role to UnauthorizedPage', () => {
      const studentUser = {
        id: 'u-student',
        role: 'STUDENT',
        name: 'Student Sharma',
        email: 'student@civnexa.edu',
      };
      render(<GuardedApp initialUser={studentUser} defaultAuthenticated={true} />);
      expect(screen.getByText('Access Restricted')).toBeDefined();
    });

    it('permits SUPER_ADMIN to access protected workspace', () => {
      const adminUser = {
        id: 'u-admin-root',
        role: 'SUPER_ADMIN',
        name: 'Platform Administrator',
        email: 'admin@civnexa.edu',
      };
      render(<GuardedApp initialUser={adminUser} defaultAuthenticated={true} />);
      expect(screen.getByText('Protected Dean Workspace')).toBeDefined();
    });
  });

  // ----------------------------------------------------
  // 5. Login Page Tests
  // ----------------------------------------------------
  describe('5. Login Page (LoginPage)', () => {
    const renderLoginPage = () =>
      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <ToastProvider>
              <LoginPage />
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

    it('renders clean institutional email and password inputs without demo pills', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/Institutional Email Address/i)).toBeDefined();
      expect(screen.getByLabelText(/^Password/i)).toBeDefined();
      expect(screen.queryByText('Select Demo Persona:')).toBeNull();
      expect(screen.queryByText('8 Roles Available')).toBeNull();
      expect(screen.getByText(/Institutional Onboarding/i)).toBeDefined();
    });

    it('displays validation errors on empty submission', async () => {
      renderLoginPage();

      const submitBtn = screen.getByRole('button', { name: /Sign In to Platform/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText('Institutional email is required.')).toBeDefined();
    });

    it('displays backend error message on 401 Unauthorized', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
        status: 401,
        message: 'Invalid email or password.',
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/Institutional Email Address/i);
      const passInput = screen.getByLabelText(/^Password/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In to Platform/i });

      fireEvent.change(emailInput, { target: { value: 'invalid@civnexa.edu' } });
      fireEvent.change(passInput, { target: { value: 'WrongPassword123' } });
      fireEvent.click(submitBtn);

      const matches = await screen.findAllByText('Invalid email or password.');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('displays rate limiting error on HTTP 429 Too Many Requests', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
        status: 429,
        message: 'Too many login attempts. Please wait before trying again.',
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/Institutional Email Address/i);
      const passInput = screen.getByLabelText(/^Password/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In to Platform/i });

      fireEvent.change(emailInput, { target: { value: 'rate@civnexa.edu' } });
      fireEvent.change(passInput, { target: { value: 'Password@123' } });
      fireEvent.click(submitBtn);

      const matches = await screen.findAllByText(
        'Too many login attempts. Please wait before trying again.'
      );
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('displays network failure warning when backend is unreachable', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
        status: 0,
        code: 'ERR_NETWORK',
        message: 'Unable to connect to CIVNEXA authentication service.',
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/Institutional Email Address/i);
      const passInput = screen.getByLabelText(/^Password/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In to Platform/i });

      fireEvent.change(emailInput, { target: { value: 'test@civnexa.edu' } });
      fireEvent.change(passInput, { target: { value: 'Password@123' } });
      fireEvent.click(submitBtn);

      const matches = await screen.findAllByText(
        'Unable to connect to CIVNEXA authentication service.'
      );
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('successfully logs in with nested response structure and toast shows user name', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        message: 'Authentication successful',
        data: {
          accessToken: 'jwt-nested-admin-token-777',
          tokenType: 'Bearer',
          expiresInMs: 900000,
          user: {
            id: 1,
            email: 'admin@civnexa.edu',
            name: 'Platform Administrator',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            userReference: 'ADM-ROOT-001',
            passwordChangeRequired: true,
          },
        },
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/Institutional Email Address/i);
      const passInput = screen.getByLabelText(/^Password/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In to Platform/i });

      fireEvent.change(emailInput, { target: { value: 'admin@civnexa.edu' } });
      fireEvent.change(passInput, { target: { value: 'AdminPassword@123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(getAuthToken()).toBe('jwt-nested-admin-token-777');
      });
    });
  });

  // ----------------------------------------------------
  // 6. Password Change & Registration Integration Tests
  // ----------------------------------------------------
  describe('6. Password Change & Enhanced Registration Tests', () => {
    it('authService.changePassword submits correct payload and returns updated user', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        message: 'Password changed successfully',
        data: {
          id: 1,
          email: 'admin@civnexa.edu',
          name: 'Platform Administrator',
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          passwordChangeRequired: false,
        },
      });

      const res = await authService.changePassword({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123@',
        confirmPassword: 'NewPassword123@',
      });

      expect(res.success).toBe(true);
      expect(res.user.passwordChangeRequired).toBe(false);
      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123@',
        confirmPassword: 'NewPassword123@',
      });
    });

    it('authService.changePassword captures field errors from server', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
        status: 400,
        message: 'Validation failed for one or more fields',
        data: {
          success: false,
          data: {
            currentPassword: 'Current password is incorrect',
          },
        },
      });

      await expect(
        authService.changePassword({
          currentPassword: 'WrongPassword!',
          newPassword: 'NewPassword123@',
          confirmPassword: 'NewPassword123@',
        })
      ).rejects.toSatisfy((err) => {
        return err.fieldErrors && err.fieldErrors.currentPassword === 'Current password is incorrect';
      });
    });

    it('authService.register packages combined name, rollNumber, and department', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        message: 'Student registration submitted successfully',
        data: {
          id: 10,
          email: 'student@civnexa.edu',
          name: 'Priya Sharma',
          role: 'STUDENT',
          status: 'PENDING_VERIFICATION',
        },
      });

      const res = await authService.register({
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'student@civnexa.edu',
        institutionalId: '22CSE045',
        departmentId: 1,
        department: 'Computer Science & Engineering',
        password: 'ValidPassword123!',
      });

      expect(res.user.name).toBe('Priya Sharma');
      expect(res.status).toBe('PENDING_VERIFICATION');
      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({
          name: 'Priya Sharma',
          firstName: 'Priya',
          lastName: 'Sharma',
          email: 'student@civnexa.edu',
          rollNumber: '22CSE045',
          institutionalId: '22CSE045',
          departmentId: 1,
          department: 'Computer Science & Engineering',
          role: 'STUDENT',
        })
      );
    });

    it('RegisterPage renders validation errors for missing required fields without clearing inputs', async () => {
      render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ToastProvider>
            <RegisterPage />
          </ToastProvider>
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /Submit Registration/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText('Please correct the highlighted fields before submitting.')).toBeDefined();
      expect(screen.getByText('First name is required.')).toBeDefined();
      expect(screen.getByText('Official university email is required.')).toBeDefined();
    });

    it('RegisterPage allows toggling password visibility and renders checklist', async () => {
      render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ToastProvider>
            <RegisterPage />
          </ToastProvider>
        </MemoryRouter>
      );

      const passInput = screen.getByLabelText(/^Password \*/i);
      expect(passInput.getAttribute('type')).toBe('password');

      fireEvent.change(passInput, { target: { value: 'Pass' } });
      expect(screen.getByText('Password Requirements:')).toBeDefined();

      const showPassBtn = screen.getByRole('button', { name: /Toggle password visibility/i });
      fireEvent.click(showPassBtn);
      expect(passInput.getAttribute('type')).toBe('text');
    });

    it('SettingsPage renders password change form and handles password update', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@civnexa.edu',
        name: 'Platform Administrator',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        passwordChangeRequired: true,
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        success: true,
        message: 'Password changed successfully',
        data: {
          ...mockUser,
          passwordChangeRequired: false,
        },
      });

      render(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider initialUser={mockUser}>
            <ToastProvider>
              <SettingsPage />
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Account Password & Security')).toBeDefined();

      const currentPass = screen.getByLabelText(/^Current Password/i);
      const newPass = screen.getByLabelText(/^New Password/i);
      const confirmPass = screen.getByLabelText(/^Confirm New Password/i);

      fireEvent.change(currentPass, { target: { value: 'OldPassword123!' } });
      fireEvent.change(newPass, { target: { value: 'NewSuperPass2026@' } });
      fireEvent.change(confirmPass, { target: { value: 'NewSuperPass2026@' } });

      const updateBtn = screen.getByRole('button', { name: /Update Password/i });
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(screen.getByText(/Your password has been changed successfully/i)).toBeDefined();
      });
    });
  });
});
