import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import AppRoutes from '../routes/AppRoutes';
import { MOCK_USERS } from '../mocks/mockUsers';
import { MOCK_STUDENTS } from '../mocks/mockStudents';
import caseService from '../services/caseService';
import committeeService from '../services/committeeService';
import hearingService from '../services/hearingService';
import counselingService from '../services/counselingService';

const renderWithRole = (initialRoute = '/dashboard', userPersona = MOCK_USERS[1]) => {
  window.sessionStorage.setItem('civnexa_auth_session', 'active');
  window.sessionStorage.setItem('civnexa_current_user', JSON.stringify(userPersona));
  window.sessionStorage.setItem('civnexa_demo_user_id', userPersona.id);

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

describe('CIVNEXA FE-5: Role-Specific Dashboards & Student Experience', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    caseService.resetMockData();
    committeeService.resetMockData();
    hearingService.resetMockData();
    counselingService.resetMockData();
  });

  describe('1. Role-Specific Dashboards ("/dashboard")', () => {
    it('renders Super Admin dashboard with global system metrics and user management shortcuts', async () => {
      const superAdmin = MOCK_USERS.find((u) => u.role === 'SUPER_ADMIN');
      renderWithRole('/dashboard', superAdmin);

      expect(await screen.findByText(/Global Governance Console/i)).toBeDefined();
      expect(screen.getByText(/Total University Cases/i)).toBeDefined();
      expect(screen.getByText(/Total Enrolled Students/i)).toBeDefined();
      expect(screen.getByText(/User Directory/i)).toBeDefined();
      expect(screen.getByText(/University Incident Distribution/i)).toBeDefined();
    });

    it('renders Dean dashboard with institutional oversight and verification queue metrics', async () => {
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      renderWithRole('/dashboard', dean);

      expect(await screen.findByText('Institutional Conduct & Support Overview')).toBeDefined();
      expect(screen.getByText(/Total Registered Cases/i)).toBeDefined();
      expect(screen.getByText(/Active \/ In-Review/i)).toBeDefined();
      expect(screen.getByText(/Review Verification Queue/i)).toBeDefined();
      expect(screen.getByText(/Incident Distribution by Category/i)).toBeDefined();
    });

    it('renders HOD dashboard scoped to department with student conduct metrics', async () => {
      const hod = MOCK_USERS.find((u) => u.role === 'HOD');
      renderWithRole('/dashboard', hod);

      expect(await screen.findByText(/Department Conduct & Academic Governance/i)).toBeDefined();
      expect(screen.getAllByText(/Department Cases/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Pending HOD Verification/i)).toBeDefined();
      expect(screen.getAllByText(/Student 360 View/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Department Incident Breakdown/i)).toBeDefined();
    });

    it('renders Faculty dashboard with reported incidents and invigilation shortcuts', async () => {
      const faculty = MOCK_USERS.find((u) => u.role === 'FACULTY');
      renderWithRole('/dashboard', faculty);

      expect(await screen.findByText(/Faculty & Exam Proctoring Workspace/i)).toBeDefined();
      expect(screen.getByText(/Incidents Logged by You/i)).toBeDefined();
      expect(screen.getByText(/Awaiting Student Response/i)).toBeDefined();
      expect(screen.getByText(/Report Exam Incident/i)).toBeDefined();
    });

    it('renders Staff & Warden dashboard with hostel curfew and campus safety logs', async () => {
      const staff = MOCK_USERS.find((u) => u.role === 'STAFF');
      renderWithRole('/dashboard', staff);

      expect(await screen.findByText(/Campus Safety & Residential Discipline Workspace/i)).toBeDefined();
      expect(screen.getByText(/Hostel Discipline Cases/i)).toBeDefined();
      expect(screen.getByText(/Campus Safety Reports/i)).toBeDefined();
      expect(screen.getByText(/Report Safety Incident/i)).toBeDefined();
    });

    it('renders Coordinator dashboard with counseling referrals and follow-ups', async () => {
      const coordinator = MOCK_USERS.find((u) => u.role === 'COORDINATOR');
      renderWithRole('/dashboard', coordinator);

      expect(await screen.findByText(/Student Counseling & Mentorship Desk/i)).toBeDefined();
      expect(screen.getByText(/Active Counseling Referrals/i)).toBeDefined();
      expect(screen.getByText(/Scheduled Sessions/i)).toBeDefined();
      expect(screen.getByText(/Pending Welfare Follow-ups/i)).toBeDefined();
      expect(screen.getByText(/Schedule Session/i)).toBeDefined();
    });

    it('renders Committee Member dashboard with assigned review dockets and hearings calendar', async () => {
      const committee = MOCK_USERS.find((u) => u.role === 'COMMITTEE_MEMBER');
      renderWithRole('/dashboard', committee);

      expect(await screen.findByText(/Disciplinary Committee & Proctorial Board/i)).toBeDefined();
      expect(screen.getByText(/Cases Assigned to Committee/i)).toBeDefined();
      expect(screen.getByText(/Deliberation Queue/i)).toBeDefined();
    });

    it('renders Student personal dashboard with active inquiries, grievances, and quick actions', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithRole('/dashboard', student);

      expect(await screen.findByText(/Student Support & Conduct Portal/i)).toBeDefined();
      expect(screen.getAllByText(/My Active Cases/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/My Filed Grievances/i)).toBeDefined();
      expect(screen.getAllByText(/File a Grievance/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Request Counseling/i).length).toBeGreaterThan(0);
    });
  });

  describe('2. Student Portal Experience (/student/*)', () => {
    it('renders Student Profile with academic standing, mentor details, and conduct tabs', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithRole('/student/profile', student);

      expect(await screen.findByText('My Student Dossier & Conduct Profile')).toBeDefined();
      expect(screen.getByText(/Academic & Enrollment Dossier/i)).toBeDefined();
      expect(screen.getAllByText(/Aarav Sharma/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/22CSE041/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Assigned Mentorship & Leadership/i)).toBeDefined();

      // Switch to Case History tab
      const caseHistoryTab = screen.getByText('My Case History');
      fireEvent.click(caseHistoryTab);
      await waitFor(() => {
        expect(screen.getAllByText(/View Full File/i).length).toBeGreaterThan(0);
      });
    });

    it('renders Student Complaints page tracking submitted grievances and anonymity status', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithRole('/student/complaints', student);

      expect(await screen.findByText('My Submitted Grievances & Campus Complaints')).toBeDefined();
      expect(screen.getByText(/Total Grievances/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/Search complaints by subject, reference/i)).toBeDefined();
      expect(screen.getByText(/File New Grievance/i)).toBeDefined();
    });

    it('renders Student Notifications with official summons and allows marking as read', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithRole('/student/notifications', student);

      expect(await screen.findByText('Official Student Notices & Hearing Summons')).toBeDefined();
      expect(screen.getByText(/Formal Summons: Disciplinary Hearing Scheduled/i)).toBeDefined();

      // Acknowledge a notice
      const acknowledgeBtns = screen.getAllByText('Acknowledge');
      expect(acknowledgeBtns.length).toBeGreaterThan(0);
      fireEvent.click(acknowledgeBtns[0]);
    });

    it('renders Campus Support & Helpdesk with emergency helplines and FAQ accordion', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithRole('/student/support', student);

      expect(await screen.findByText('Campus Support, Counseling & Helpdesk')).toBeDefined();
      expect(screen.getByText(/National Anti-Ragging: 1800-180-5522/i)).toBeDefined();
      expect(screen.getByText(/Student Wellbeing & Counseling Services/i)).toBeDefined();
      expect(screen.getByText(/Frequently Asked Procedural Questions/i)).toBeDefined();

      // Click FAQ item
      const faqQuestion = screen.getByText(/Can I bring a faculty mentor or student advisor to my hearing/i);
      fireEvent.click(faqQuestion);
      await waitFor(() => {
        expect(screen.getByText(/accompanied by a designated faculty mentor/i)).toBeDefined();
      });
    });

    it('renders Student Appeals with neutral badge', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithRole('/student/appeals', student);

      expect(await screen.findByText(/Institutional Decision Appeals & Appellate Review/i)).toBeDefined();
      expect(screen.getByText(/Student Appeals/i)).toBeDefined();
      expect(screen.getByText(/Grounds for Appeal/i)).toBeDefined();
    });
  });

  describe('3. Student 360 View (/hod/student-360)', () => {
    it('renders Student 360 profile with search, timeline, and clinical privacy masking', async () => {
      const hod = MOCK_USERS.find((u) => u.role === 'HOD');
      renderWithRole('/hod/student-360', hod);

      expect(await screen.findByText('Student 360° Comprehensive Conduct Dossier')).toBeDefined();
      expect(screen.getByText(/Statutory Confidentiality Protocol Active/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/Search student by name, roll number, or department/i)).toBeDefined();
      expect(screen.getByText(/Conduct & Incident Records/i)).toBeDefined();
      expect(screen.getByText(/Longitudinal Conduct Timeline/i)).toBeDefined();

      // Clinical therapy note masking check
      expect(await screen.findByText(/Clinical Privacy Mask/i)).toBeDefined();
    });

    it('allows switching selected student via student dropdown', async () => {
      const hod = MOCK_USERS.find((u) => u.role === 'HOD');
      renderWithRole('/hod/student-360', hod);

      await screen.findByText('Student 360° Comprehensive Conduct Dossier');

      // Select another student from select dropdown
      const studentSelect = screen.getByLabelText(/Select student profile/i);
      fireEvent.change(studentSelect, { target: { value: 'STU-7492' } });

      await waitFor(() => {
        expect(screen.getAllByText('Rohan Varma').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/23ME112/).length).toBeGreaterThan(0);
      });
    });
  });
});
