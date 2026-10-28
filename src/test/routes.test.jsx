import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import AppRoutes from '../routes/AppRoutes';

const renderWithProviders = (initialRoute = '/') => {
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

describe('Client-Side Routing Verification (FE-1)', () => {
  it('renders Public Landing Page at root path ("/")', async () => {
    renderWithProviders('/');
    expect(await screen.findByText('A Better Way to Support Campus Communities')).toBeDefined();
    expect(screen.getByText('Report. Verify. Support. Resolve.')).toBeDefined();
    expect(screen.getByText(/Manage campus cases, grievances, appeals, and student support through one organized platform/i)).toBeDefined();
  });

  it('renders OverviewDemoPage at authenticated path ("/dashboard")', async () => {
    renderWithProviders('/dashboard');
    expect(await screen.findByText('Institutional Conduct & Support Overview')).toBeDefined();
    expect(screen.getByText(/Total Registered Cases/i)).toBeDefined();
    expect(screen.getByText(/Active \/ In-Review/i)).toBeDefined();
  });

  it('renders CasesPage at "/cases"', async () => {
    renderWithProviders('/cases');
    expect(await screen.findByText('Case Management Registry')).toBeDefined();
    expect(screen.getByPlaceholderText(/Search by case reference/i)).toBeDefined();
  });

  it('renders GrievancesPage at "/grievances"', async () => {
    renderWithProviders('/grievances');
    expect(await screen.findByText('Grievance Redressal & Campus Safety')).toBeDefined();
    expect(screen.getByText('Active Grievance Records')).toBeDefined();
  });

  it('renders CounselingPage at "/counseling"', async () => {
    renderWithProviders('/counseling');
    expect(await screen.findByText('Counseling, Mentorship & Student Welfare')).toBeDefined();
    expect(screen.getByText('ACTIVE SESSIONS')).toBeDefined();
  });

  it('renders PoliciesPage at "/policies"', async () => {
    renderWithProviders('/policies');
    expect(await screen.findByText('Institutional Policies & Conduct Standards')).toBeDefined();
    expect(screen.getByText(/University Student Code of Conduct/i)).toBeDefined();
  });

  it('renders ReportsPage at "/reports"', async () => {
    renderWithProviders('/reports');
    expect(await screen.findByText('Institutional Analytics & Reporting')).toBeDefined();
    expect(screen.getByText(/AVG RESOLUTION VELOCITY/i)).toBeDefined();
  });

  it('renders SettingsPage at "/settings"', async () => {
    renderWithProviders('/settings');
    expect(await screen.findByText('System Governance & Settings')).toBeDefined();
    expect(screen.getByText(/User Profile & Credentials/i)).toBeDefined();
  });

  it('renders UnauthorizedPage at "/unauthorized"', async () => {
    renderWithProviders('/unauthorized');
    expect(await screen.findByText('Access Restricted')).toBeDefined();
  });

  it('renders NotFoundPage on unknown route', async () => {
    renderWithProviders('/non-existent-or-invalid-route-slug');
    expect(await screen.findByText('Page Not Found')).toBeDefined();
    expect(screen.getByText('Return to Institutional Overview')).toBeDefined();
  });
});
