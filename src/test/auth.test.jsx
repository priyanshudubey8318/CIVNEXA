import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import AppRoutes from '../routes/AppRoutes';
import authService from '../services/authService';

const renderWithProviders = (ui, initialRoute = '/login') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          {ui}
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('CIVNEXA Authentication Flows & Component Tests', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('renders login page with wordmark, inputs, and institutional onboarding link', async () => {
    renderWithProviders(<LoginPage />, '/login');

    expect(screen.getByText('Sign In to CIVNEXA')).toBeDefined();
    expect(screen.getByLabelText(/Institutional Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password/i)).toBeDefined();
    expect(screen.getByText(/Institutional Onboarding/i)).toBeDefined();
    expect(screen.queryByText('Select Demo Persona:')).toBeNull();
  });

  it('validates empty and invalid email formats on login', async () => {
    renderWithProviders(<LoginPage />, '/login');

    const emailInput = screen.getByLabelText(/Institutional Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Platform/i });

    // Clear email and test empty validation
    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Institutional email is required.')).toBeDefined();

    // Invalid format
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please enter a valid email format/i)).toBeDefined();
  });

  it('toggles password visibility between password and text', async () => {
    renderWithProviders(<LoginPage />, '/login');

    const passwordInput = screen.getByLabelText(/^Password/i);
    const toggleBtn = screen.getByLabelText(/Show password/i);

    expect(passwordInput.getAttribute('type')).toBe('password');

    fireEvent.click(toggleBtn);
    expect(passwordInput.getAttribute('type')).toBe('text');

    fireEvent.click(screen.getByLabelText(/Hide password/i));
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('successfully logs in via backend credentials and transitions session', async () => {
    const loginSpy = vi.spyOn(authService, 'login').mockResolvedValueOnce({
      user: {
        id: 'USR-DEAN-001',
        name: 'Prof. Ananya Sen',
        role: 'DEAN',
        roleLabel: 'Dean / Central Admin',
        department: 'Academic Affairs',
        email: 'dean@civnexa.edu',
      },
      token: 'jwt-token-dean-123',
    });

    renderWithProviders(<AppRoutes />, '/login');

    const emailInput = screen.getByLabelText(/Institutional Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Platform/i });

    fireEvent.change(emailInput, { target: { value: 'dean@civnexa.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'Password@123' } });
    fireEvent.click(submitBtn);

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'dean@civnexa.edu',
      password: 'Password@123',
    });

    // Wait for redirect to protected overview
    await waitFor(() => {
      expect(screen.getByText('Institutional Conduct & Support Overview')).toBeDefined();
    }, { timeout: 4000 });
  });

  it('renders and processes forgot password request with recovery note', async () => {
    renderWithProviders(<ForgotPasswordPage />, '/forgot-password');

    expect(screen.getByText('Password Recovery')).toBeDefined();
    const emailInput = screen.getByLabelText(/Institutional Email Address/i);
    const submitBtn = screen.getByRole('button', { name: /Send Recovery Link/i });

    fireEvent.change(emailInput, { target: { value: 'student@civnexa.edu' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Recovery Request Processed')).toBeDefined();
    expect(screen.getByText('Proceed to Password Reset Demo')).toBeDefined();
  });

  it('enforces password reset complexity checklist and matching validation', async () => {
    renderWithProviders(<ResetPasswordPage />, '/reset-password');

    expect(screen.getByText('Reset Password')).toBeDefined();
    expect(screen.getByText('Password Requirements:')).toBeDefined();

    const newPassInput = screen.getByLabelText(/^New Password \*/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password \*/i);
    const submitBtn = screen.getByRole('button', { name: /Reset & Update Password/i });

    // Submit button should initially be disabled because requirements aren't met
    expect(submitBtn.hasAttribute('disabled')).toBe(true);

    // Enter matching valid password meeting all 3 criteria: 8+ chars, number, uppercase
    fireEvent.change(newPassInput, { target: { value: 'ValidPass@2026' } });
    fireEvent.change(confirmPassInput, { target: { value: 'ValidPass@2026' } });

    // Submit button should now be enabled
    expect(submitBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(submitBtn);
    expect(await screen.findByText('Password Successfully Reset')).toBeDefined();
  });

  it('clears session and returns to public landing page upon logout', async () => {
    const deanUser = {
      id: 'USR-002',
      name: 'Prof. Ananya Sen',
      role: 'DEAN',
      department: 'Academic Affairs',
      email: 'dean@civnexa.edu',
    };

    window.sessionStorage.setItem('civnexa_auth_session', 'active');
    window.sessionStorage.setItem('civnexa_current_user', JSON.stringify(deanUser));

    renderWithProviders(<AppRoutes />, '/dashboard');
    expect(await screen.findByText('Institutional Conduct & Support Overview')).toBeDefined();

    // Click profile dropdown trigger
    const profileBtn = screen.getByRole('button', { name: /Prof. Ananya Sen avatar/i });
    fireEvent.click(profileBtn);

    // Click Sign Out
    const signOutBtn = await screen.findByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /Sign In/i }).length).toBeGreaterThan(0);
    }, { timeout: 4000 });
  });
});
