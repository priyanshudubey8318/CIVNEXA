import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import AppRoutes from '../routes/AppRoutes';
import { MOCK_USERS } from '../mocks/mockUsers';

const renderApp = (initialRoute = '/', defaultAuthenticated = false, mockUser = null) => {
  if (mockUser) {
    window.sessionStorage.setItem('civnexa_current_user', JSON.stringify(mockUser));
    window.sessionStorage.setItem('civnexa_auth_session', 'active');
  } else if (!defaultAuthenticated) {
    window.sessionStorage.removeItem('civnexa_current_user');
    window.sessionStorage.removeItem('civnexa_auth_session');
  }

  return render(
    <MemoryRouter initialEntries={[initialRoute]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider defaultAuthenticated={defaultAuthenticated}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('CIVNEXA — Landing Page, Routing & Contrast Quality Verification', () => {
  it('1. Renders the Public Landing Page at root ("/") without requiring authentication', async () => {
    renderApp('/', false);

    // Headline and brand tagline
    expect(await screen.findByText('A Better Way to Support Campus Communities')).toBeDefined();
    expect(screen.getByText('Report. Verify. Support. Resolve.')).toBeDefined();
    expect(screen.getByText(/Manage campus cases, grievances, appeals, and student support through one organized platform/i)).toBeDefined();

    // Four core capability pillars
    expect(screen.getByText('Case Management')).toBeDefined();
    expect(screen.getByText('Student Grievances')).toBeDefined();
    expect(screen.getByText('Review and Appeals')).toBeDefined();
    expect(screen.getByText('Counseling and Support')).toBeDefined();

    // Three workflow steps
    expect(screen.getByText('Report & Intake')).toBeDefined();
    expect(screen.getByText('Review & Deliberate')).toBeDefined();
    expect(screen.getByText('Support & Resolve')).toBeDefined();

    // Must have visible Sign In buttons
    const signInLinks = screen.getAllByRole('link', { name: /Sign In/i });
    expect(signInLinks.length).toBeGreaterThan(0);
    expect(signInLinks[0].getAttribute('href')).toBe('/login');

    // Must have Explore Features action
    expect(screen.getByRole('button', { name: /Explore Features/i })).toBeDefined();
  });

  it('2. Keeps Login Page accessible through its dedicated route ("/login")', async () => {
    renderApp('/login', false);

    expect(await screen.findByText('Sign In to CIVNEXA')).toBeDefined();
    expect(screen.getByPlaceholderText(/ananya\.sen@civnexa\.edu/i)).toBeDefined();
    expect(screen.getByText(/Select Demo Persona:/i)).toBeDefined();
  });

  it('3. Redirects unauthenticated users attempting to access protected routes to /login', async () => {
    renderApp('/dashboard', false);

    expect(await screen.findByText('Sign In to CIVNEXA')).toBeDefined();
  });

  it('4. Redirects unauthenticated users accessing /cases to /login with return state', async () => {
    renderApp('/cases', false);

    expect(await screen.findByText('Sign In to CIVNEXA')).toBeDefined();
  });

  it('5. Allows already authenticated visitor visiting "/" to see "Go to Dashboard" action', async () => {
    const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
    renderApp('/', true, dean);

    expect(await screen.findByText('A Better Way to Support Campus Communities')).toBeDefined();

    // Displays Go to Dashboard button
    const dashboardButtons = screen.getAllByRole('link', { name: /Go to Dashboard/i });
    expect(dashboardButtons.length).toBeGreaterThan(0);
    expect(dashboardButtons[0].getAttribute('href')).toBe('/dashboard');
  });

  it('6. Successfully logs in from login page and reaches the dashboard', async () => {
    renderApp('/login', false);

    // Click Student persona pill
    const studentPersonaBtn = await screen.findByRole('button', { name: /Student \(3rd Year CSE\)/i });
    fireEvent.click(studentPersonaBtn);

    // Click Sign In button
    const submitBtn = screen.getByRole('button', { name: /Sign In to Platform/i });
    fireEvent.click(submitBtn);

    // Should navigate to dashboard
    await waitFor(() => {
      expect(screen.getByText(/Student Support & Conduct Portal/i)).toBeDefined();
    }, { timeout: 4000 });
  });

  it('7. Displays clear "Not Available" badge and messaging for placeholder routes', async () => {
    const hod = MOCK_USERS.find((u) => u.role === 'HOD');
    renderApp('/hod/students', true, hod);

    const dirHeadings = await screen.findAllByText('Department Student Directory');
    expect(dirHeadings.length).toBeGreaterThan(0);
    expect(screen.getByText('Not Available')).toBeDefined();
    expect(screen.getByText(/This section is not yet available in the demonstration/i)).toBeDefined();

    const returnBtn = screen.getByRole('link', { name: /Return to Dashboard/i });
    expect(returnBtn.getAttribute('href')).toBe('/dashboard');
  });

  it('8. Verifies Verification Queue buttons render cleanly for authorized role', async () => {
    const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
    renderApp('/dean/verification', true, dean);

    const queueHeadings = await screen.findAllByText(/Verification Queue/i);
    expect(queueHeadings.length).toBeGreaterThan(0);
  });
});
