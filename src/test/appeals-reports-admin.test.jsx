import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import AppRoutes from '../routes/AppRoutes';
import { MOCK_USERS } from '../mocks/mockUsers';
import caseService from '../services/caseService';
import committeeService from '../services/committeeService';
import hearingService from '../services/hearingService';
import counselingService from '../services/counselingService';
import appealService from '../services/appealService';
import reportingService from '../services/reportingService';
import adminService from '../services/adminService';

const renderWithRole = (initialRoute = '/', userPersona = MOCK_USERS[1]) => {
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

describe('CIVNEXA FE-6: Appellate Review, Institutional Reporting & System Administration', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    caseService.resetMockData();
    committeeService.resetMockData();
    hearingService.resetMockData();
    counselingService.resetMockData();
    appealService.resetMockData();
    adminService.resetMockData();
  });

  // =========================================================================
  // 1. APPELLATE SERVICE & WORKFLOWS
  // =========================================================================
  describe('1. Student Appeals Management & Submissions', () => {
    it('allows a student to lodge a structured appeal and preserves the original decision', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');

      // Submit appeal via service
      const newAppeal = await appealService.submitAppeal({
        caseId: 'CX-2026-0101',
        caseNumber: 'CX-2026-0101',
        caseTitle: 'Unauthorized electronic device detected',
        originalDecision: {
          decisionDate: '2026-10-18T12:00:00Z',
          decisionSummary: 'Smartwatch confiscated and course exam credit suspended.',
          sanctionType: 'COURSE_SUSPENSION',
          decidedBy: 'Disciplinary Committee',
        },
        grounds: ['PROPORTIONALITY', 'NEW_EVIDENCE'],
        explanation: 'The smartwatch was non-functional and carried inadvertently due to emergency travel without intent to use.',
        reliefSought: 'Cancellation of exam credit suspension and permission for supplementary exam.',
        supportingDocuments: [{ id: 'DOC-1', name: 'repair_invoice.pdf', size: '200 KB', type: 'application/pdf' }],
        currentUser: student,
      });

      // Verify appeal reference format
      expect(newAppeal.appealNumber).toMatch(/^APL-2026-\d{3}$/);
      expect(newAppeal.status).toBe('SUBMITTED');
      expect(newAppeal.grounds.length).toBe(2);

      // Verify original decision was preserved
      expect(newAppeal.originalDecision.decisionPreserved).toBe(true);
      expect(newAppeal.originalDecision.sanctionType).toBe('COURSE_SUSPENSION');

      // Verify original case was not corrupted or deleted
      const parentCase = await caseService.getCaseById('CX-2026-0101');
      expect(parentCase).toBeDefined();
      expect(parentCase.caseNumber).toBe('CX-2026-0101');
    });

    it('enforces validation on required appeal fields', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');

      // Missing case ID
      await expect(
        appealService.submitAppeal({
          caseId: '',
          grounds: ['PROCEDURAL_CONCERN'],
          explanation: 'Valid explanation length of more than 20 characters.',
          currentUser: student,
        })
      ).rejects.toThrow(/Case reference is required/i);

      // Missing grounds
      await expect(
        appealService.submitAppeal({
          caseId: 'CX-2026-0101',
          caseNumber: 'CX-2026-0101',
          grounds: [],
          explanation: 'Valid explanation length of more than 20 characters.',
          currentUser: student,
        })
      ).rejects.toThrow(/At least one statutory ground/i);

      // Short explanation
      await expect(
        appealService.submitAppeal({
          caseId: 'CX-2026-0101',
          caseNumber: 'CX-2026-0101',
          grounds: ['FACTUAL_ERROR'],
          explanation: 'Too short',
          currentUser: student,
        })
      ).rejects.toThrow(/at least 20 characters/i);
    });

    it('renders Student Appeals portal with active dockets and submission wizard', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithRole('/student/appeals', student);

      expect(await screen.findByText('Institutional Decision Appeals & Appellate Review')).toBeDefined();
      expect(screen.getByText(/Student Appeals/i)).toBeDefined();
      expect(screen.getByText(/Grounds for Appeal/i)).toBeDefined();
      expect(screen.getByText(/Lodge New Appeal/i)).toBeDefined();
      expect(screen.getByText(/My Filed Appellate Dockets & Inquiries/i)).toBeDefined();
    });
  });

  describe('2. Appellate Review & Determination Workflows', () => {
    it('allows authorized reviewer to assign reviewer, request info, and authorize final outcome', async () => {
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      const committeeLead = MOCK_USERS.find((u) => u.role === 'COMMITTEE_MEMBER');

      // 1. Assign reviewer
      const assigned = await appealService.assignReviewer('APL-2026-001', committeeLead, dean);
      expect(assigned.status).toBe('UNDER_REVIEW');
      expect(assigned.assignedReviewer.name).toBe(committeeLead.name);

      // 2. Request additional information
      const infoRequested = await appealService.requestAdditionalInfo(
        'APL-2026-001',
        { query: 'Please furnish passenger ticket confirmation.', deadline: '2026-10-30' },
        committeeLead
      );
      expect(infoRequested.status).toBe('ADDITIONAL_INFORMATION_REQUESTED');
      expect(infoRequested.additionalInfoRequests.length).toBeGreaterThan(0);

      // 3. Submit recommendation
      const recommended = await appealService.submitRecommendation(
        'APL-2026-001',
        {
          recommendationText: 'Passenger delay confirmed by regional rail authority.',
          proposedOutcome: 'MODIFIED',
          justification: 'Sanction fine is sufficient; remove residential record endorsement.',
        },
        committeeLead
      );
      expect(recommended.status).toBe('REVIEW_COMPLETED');
      expect(recommended.recommendation.proposedOutcome).toBe('MODIFIED');

      // 4. Authorize final outcome (human action)
      const finalized = await appealService.recordFinalOutcome(
        'APL-2026-001',
        {
          outcome: 'MODIFIED',
          justification: 'Executive order: Formal residential endorsement waived in light of verified rail emergency.',
          authorizedBy: dean.name,
        },
        dean
      );
      expect(finalized.status).toBe('MODIFIED');
      expect(finalized.finalOutcome.outcome).toBe('MODIFIED');
      expect(finalized.finalOutcome.authorizedBy).toBe(dean.name);

      // 5. Verify timeline preserved non-destructively
      expect(finalized.timeline.length).toBeGreaterThanOrEqual(4);
    });

    it('renders Appellate Review Workspace for Dean and blocks unauthorized Student access', async () => {
      // 1. Dean access
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      const { unmount } = renderWithRole('/appeals/review', dean);

      expect(await screen.findByText('Appellate Review & Ombudsman Docket')).toBeDefined();
      expect(screen.getByText(/Active Appellate Review Petitions/i)).toBeDefined();
      unmount();

      // 2. Student disallowed access
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithRole('/appeals/review', student);
      expect(await screen.findByText('Access Restricted')).toBeDefined();
    });
  });

  // =========================================================================
  // 2. INSTITUTIONAL REPORTING & ANALYTICS
  // =========================================================================
  describe('3. Institutional Reporting & Analytics', () => {
    it('aggregates live operational metrics across cases, hearings, and appeals', async () => {
      const data = await reportingService.getReportData();

      expect(data.summary.totalCases).toBeGreaterThan(0);
      expect(data.summary.activeCases).toBeGreaterThan(0);
      expect(data.summary.avgResolutionVelocity).toBe('4.2 Days');
      expect(data.charts.categoryChartData.labels.length).toBeGreaterThan(0);
      expect(data.charts.statusChartData.labels.length).toBeGreaterThan(0);
    });

    it('correctly filters reports by department, priority, and category', async () => {
      const allData = await reportingService.getReportData();
      const cseData = await reportingService.getReportData({ department: 'CSE' });

      expect(cseData.summary.totalCases).toBeLessThanOrEqual(allData.summary.totalCases);
      cseData.records.forEach((c) => {
        expect(['CSE', 'Computer Science & Engineering']).toContain(c.departmentCode || c.department);
      });
    });

    it('generates properly escaped, Unicode-aware CSV string with sensitive data masking', () => {
      const mockReportData = {
        records: [
          {
            id: 'CX-2026-0101',
            caseNumber: 'CX-2026-0101',
            title: 'Examination device incident, with comma and "quotes"',
            category: 'Examination Incident',
            subcategory: 'Unauthorized Electronic Device',
            priority: 'HIGH',
            status: 'UNDER_INVESTIGATION',
            department: 'Computer Science & Engineering',
            student: { rollNo: '22CSE041', name: 'Aarav Sharma' },
            incidentDate: '2026-10-18',
            reportedAt: '2026-10-18',
            investigation: { investigator: 'Prof. Sunita Mehta' },
          },
        ],
      };

      // 1. Authorized Dean export
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      const csvDean = reportingService.exportToCSV(mockReportData, dean);

      expect(csvDean).toContain('"CX-2026-0101"');
      expect(csvDean).toContain('"Examination device incident, with comma and ""quotes"""');
      expect(csvDean).toContain('"Aarav Sharma"');

      // 2. Unauthorized Student export (masks other student names)
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      const csvStudent = reportingService.exportToCSV(mockReportData, student);
      expect(csvStudent).toContain('"Confidential / Masked"');
    });

    it('renders Reports Page with metrics, filters, and compliance templates', async () => {
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      renderWithRole('/reports', dean);

      expect(await screen.findByText('Institutional Analytics & Reporting')).toBeDefined();
      expect(screen.getByText(/AVG RESOLUTION VELOCITY/i)).toBeDefined();
      expect(screen.getByText(/Global Dataset Filters:/i)).toBeDefined();
      expect(screen.getByText(/Export Filtered CSV/i)).toBeDefined();

      // Switch to Compliance Templates tab
      const templatesTab = screen.getByText(/Configurable Compliance Templates/i);
      fireEvent.click(templatesTab);
      await waitFor(() => {
        expect(screen.getByText(/Academic Discipline & Code Compliance Summary/i)).toBeDefined();
      });
    });
  });

  // =========================================================================
  // 3. SYSTEM ADMINISTRATION CONSOLE
  // =========================================================================
  describe('4. System Administration Console', () => {
    it('allows demonstration user creation and enforces duplicate email checks', () => {
      // 1. Create demo user
      const newUser = adminService.createUser({
        name: 'Dr. Meenakshi Sundaram',
        email: 'meenakshi.s@civnexa.edu',
        role: 'FACULTY',
        department: 'Electronics & Communication',
        designation: 'Associate Professor',
        employeeId: 'EMP-9021',
      });

      expect(newUser.id).toBeDefined();
      expect(newUser.name).toBe('Dr. Meenakshi Sundaram');
      expect(newUser.status).toBe('ACTIVE');

      // 2. Attempt duplicate email
      expect(() => {
        adminService.createUser({
          name: 'Another User',
          email: 'meenakshi.s@civnexa.edu',
          role: 'STAFF',
        });
      }).toThrow(/already exists in the institution directory/i);
    });

    it('prevents self-lockout by forbidding deactivation of the last Super Administrator', () => {
      const superAdmins = adminService.getUsers({ role: 'SUPER_ADMIN' });
      expect(superAdmins.length).toBeGreaterThan(0);

      // Attempt to deactivate the only active super admin
      expect(() => {
        adminService.toggleUserStatus(superAdmins[0].id);
      }).toThrow(/Self-lockout safeguard/i);
    });

    it('manages role permission matrix and prevents revoking critical admin capabilities', () => {
      // Toggle a permission for DEAN
      const updated = adminService.toggleRolePermission('DEAN', 'EVIDENCE_UPLOAD');
      expect(updated.DEAN).toBeDefined();

      // Attempt revoking USER_MANAGE from SUPER_ADMIN
      expect(() => {
        adminService.toggleRolePermission('SUPER_ADMIN', 'USER_MANAGE');
      }).toThrow(/Critical governance permission cannot be revoked/i);
    });

    it('creates academic departments and prevents deletion of departments with active cases', () => {
      // 1. Create department
      const newDept = adminService.createDepartment({
        name: 'Biotechnology & Bioengineering',
        code: 'BIO',
        hodName: 'Dr. Reena Sen',
        contactEmail: 'hod.bio@civnexa.edu',
        description: 'Genomics and biotechnology research unit.',
      });
      expect(newDept.code).toBe('BIO');

      // Duplicate code check
      expect(() => {
        adminService.createDepartment({
          name: 'Duplicate Bio',
          code: 'BIO',
        });
      }).toThrow(/already exists/i);

      // 2. Prevent deleting CSE (has linked cases in mock store)
      expect(() => {
        adminService.deleteDepartment('CSE');
      }).toThrow(/Cannot remove department/i);
    });

    it('manages case categories and validates unique category code', () => {
      const cat = adminService.createCategory({
        key: 'INTELLECTUAL_PROPERTY',
        label: 'IP & Patent Infraction',
        description: 'Unauthorized commercial use of university research patents.',
        allowsAnonymous: false,
      });

      expect(cat.key).toBe('INTELLECTUAL_PROPERTY');

      // Duplicate category key check
      expect(() => {
        adminService.createCategory({
          key: 'INTELLECTUAL_PROPERTY',
          label: 'Duplicate IP',
        });
      }).toThrow(/already configured/i);
    });

    it('validates state transitions against configured workflow engine', () => {
      // Valid transition: SUBMITTED -> PENDING_VERIFICATION
      expect(adminService.validateStateTransition('SUBMITTED', 'PENDING_VERIFICATION')).toBe(true);

      // Invalid transition: SUBMITTED directly to RESOLVED
      expect(() => {
        adminService.validateStateTransition('SUBMITTED', 'RESOLVED');
      }).toThrow(/Invalid status transition/i);
    });

    it('renders User Management, Department Management, and Audit Logs pages for Super Admin', async () => {
      const superAdmin = MOCK_USERS.find((u) => u.role === 'SUPER_ADMIN');

      // User Management
      const { unmount: unmountUsers } = renderWithRole('/admin/users', superAdmin);
      expect(await screen.findByText('User Management & Institutional Accounts')).toBeDefined();
      expect(screen.getByText(/Create User/i)).toBeDefined();
      unmountUsers();

      // Department Management
      const { unmount: unmountDepts } = renderWithRole('/admin/departments', superAdmin);
      expect(await screen.findByText('Department & Academic Unit Registry')).toBeDefined();
      expect(screen.getByText(/Add Academic Department/i)).toBeDefined();
      unmountDepts();

      // Audit Logs
      renderWithRole('/admin/audit', superAdmin);
      expect((await screen.findAllByText('System Audit Logs')).length).toBeGreaterThan(0);
      expect(screen.getByText(/Audit Event Ledger/i)).toBeDefined();
    });
  });
});
