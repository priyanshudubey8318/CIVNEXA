import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import AppRoutes from '../routes/AppRoutes';
import { getNavigationForRole, ROLE_NAVIGATION } from '../routes/navigationConfig';
import { ROLES, MOCK_USERS } from '../mocks/mockUsers';

const renderWithRole = (initialRoute = '/', user = MOCK_USERS[1]) => {
  window.sessionStorage.setItem('civnexa_auth_session', 'active');
  window.sessionStorage.setItem('civnexa_current_user', JSON.stringify(user));

  return render(
    <MemoryRouter initialEntries={[initialRoute]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('FE-2 Role Navigation Configuration & Route Guards', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('verifies all 8 roles have exact defined navigation specifications', () => {
    expect(ROLE_NAVIGATION.SUPER_ADMIN.length).toBe(10);
    expect(ROLE_NAVIGATION.DEAN.length).toBe(7);
    expect(ROLE_NAVIGATION.HOD.length).toBe(8);
    expect(ROLE_NAVIGATION.FACULTY.length).toBe(5);
    expect(ROLE_NAVIGATION.STAFF.length).toBe(4);
    expect(ROLE_NAVIGATION.COORDINATOR.length).toBe(6);
    expect(ROLE_NAVIGATION.COMMITTEE_MEMBER.length).toBe(5);
    expect(ROLE_NAVIGATION.STUDENT.length).toBe(13);
    expect(ROLE_NAVIGATION.STUDENT.map((i) => i.path)).toContain('/student/digital-id');

    // Verify key paths exist
    expect(ROLE_NAVIGATION.SUPER_ADMIN.map((i) => i.path)).toContain('/admin/users');
    expect(ROLE_NAVIGATION.DEAN.map((i) => i.path)).toContain('/dean/verification');
    expect(ROLE_NAVIGATION.HOD.map((i) => i.path)).toContain('/hod/student-360');
    expect(ROLE_NAVIGATION.FACULTY.map((i) => i.path)).toContain('/cases/create');
    expect(ROLE_NAVIGATION.COORDINATOR.map((i) => i.path)).toContain('/counseling/sessions');
    expect(ROLE_NAVIGATION.COMMITTEE_MEMBER.map((i) => i.path)).toContain('/committee/reviews');
    expect(ROLE_NAVIGATION.STUDENT.map((i) => i.path)).toContain('/student/appeals');
  });

  it('redirects unauthenticated users attempting to access protected routes to /login', async () => {
    // Render without active session
    render(
      <MemoryRouter initialEntries={['/cases']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should be redirected to sign in screen
    expect(await screen.findByText('Sign In to CIVNEXA')).toBeDefined();
    expect(screen.queryByText('Case Management Registry')).toBeNull();
  });

  it('renders Access Denied (UnauthorizedPage) when a role opens a disallowed route', async () => {
    // Authenticate as STUDENT
    const studentUser = MOCK_USERS.find((u) => u.role === 'STUDENT');
    renderWithRole('/admin/users', studentUser);

    // Student must not access Super Admin User Management
    expect(await screen.findByText('Access Restricted')).toBeDefined();
    expect(screen.getByText(/Your current persona role/i)).toBeDefined();
  });

  it('allows authorized role to access their specific workspace module', async () => {
    // Authenticate as SUPER_ADMIN
    const adminUser = MOCK_USERS.find((u) => u.role === 'SUPER_ADMIN');
    renderWithRole('/admin/users', adminUser);

    // Super Admin should see the user management workspace
    const headings = await screen.findAllByText(/User Management & Institutional Accounts/i);
    expect(headings.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/User Directory/i).length).toBeGreaterThan(0);
  });

  it('dynamically updates sidebar navigation items for different authenticated roles', async () => {
    // Start as Dean in dashboard workspace
    const { unmount } = renderWithRole('/dashboard', MOCK_USERS[1]);
    const overviewItems = await screen.findAllByText('Institutional Overview');
    expect(overviewItems.length).toBeGreaterThan(0);
    expect(screen.getByText('Verification Queue')).toBeDefined();
    unmount();

    // Render as Student
    const studentUser = MOCK_USERS.find((u) => u.role === 'STUDENT');
    renderWithRole('/dashboard', studentUser);

    // Sidebar should display Student-specific navigation
    await waitFor(() => {
      expect(screen.getByText('My Student Profile')).toBeDefined();
      expect(screen.getByText('Raise a Grievance')).toBeDefined();
      expect(screen.getByText('Appeals & Reconsideration')).toBeDefined();
    });
  });

  it('continues displaying 404 page for unknown routes in authenticated workspace', async () => {
    renderWithRole('/completely-invalid-subpath');
    expect(await screen.findByText('Page Not Found')).toBeDefined();
  });
});
