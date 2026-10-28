import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
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

describe('FE-2 Authentication Flows & Component Tests', () => {
  beforeEach(async () => {
    // Clear storage before each test
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('renders login page with wordmark, inputs, and 8 demo personas', async () => {
    renderWithProviders(<LoginPage />, '/login');

    expect(screen.getByText('Sign In to CIVNEXA')).toBeDefined();
    expect(screen.getByLabelText(/Institutional Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password/i)).toBeDefined();
    expect(screen.getByText('Select Demo Persona:')).toBeDefined();
    expect(screen.getByText('8 Roles Available')).toBeDefined();

    // Verify presence of role selector pills
    expect(screen.getByText('Dean of Student Affairs')).toBeDefined();
    expect(screen.getByText('Super Admin')).toBeDefined();
    expect(screen.getByText('Student (3rd Year CSE)')).toBeDefined();
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

  it('switches persona and pre-fills credentials upon clicking demo pill', async () => {
    renderWithProviders(<LoginPage />, '/login');

    const studentPill = screen.getByText('Student (3rd Year CSE)');
    fireEvent.click(studentPill);

    const emailInput = screen.getByLabelText(/Institutional Email Address/i);
    expect(emailInput.value).toBe('aarav.sharma@civnexa.edu');
  });

  it('successfully logs in via demo credentials and transitions session', async () => {
    renderWithProviders(<AppRoutes />, '/login');

    // Select Super Admin
    const adminPill = await screen.findByText('Super Admin');
    fireEvent.click(adminPill);

    const submitBtn = screen.getByRole('button', { name: /Sign In to Platform/i });
    fireEvent.click(submitBtn);

    // Wait for redirect to protected overview
    await waitFor(() => {
      expect(screen.getByText('Institutional Conduct & Support Overview')).toBeDefined();
      expect(window.sessionStorage.getItem('civnexa_auth_session')).toBe('active');
    }, { timeout: 4000 });
  });

  it('renders and processes forgot password request with demo note', async () => {
    renderWithProviders(<ForgotPasswordPage />, '/forgot-password');

    expect(screen.getByText('Password Recovery')).toBeDefined();
    const emailInput = screen.getByLabelText(/Institutional Email Address/i);
    const submitBtn = screen.getByRole('button', { name: /Send Recovery Link/i });

    fireEvent.change(emailInput, { target: { value: 'student@civnexa.edu' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Recovery Request Processed')).toBeDefined();
    expect(screen.getByText(/Demonstration Environment Note/i)).toBeDefined();
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

  it('clears mock session and returns to public landing page upon logout', async () => {
    // Set active session
    window.sessionStorage.setItem('civnexa_auth_session', 'active');
    window.sessionStorage.setItem(
      'civnexa_current_user',
      JSON.stringify({ id: 'USR-002', name: 'Prof. Ananya Sen', role: 'DEAN' })
    );

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
      expect(window.sessionStorage.getItem('civnexa_auth_session')).toBeNull();
    }, { timeout: 4000 });
  });
});
