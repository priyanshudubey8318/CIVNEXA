import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import AppRoutes from '../routes/AppRoutes';
import caseService from '../services/caseService';
import { searchStudents, MOCK_STUDENTS } from '../mocks/mockStudents';
import { MOCK_USERS } from '../mocks/mockUsers';

const renderWithProviders = (initialRoute = '/', user = MOCK_USERS[1]) => {
  window.sessionStorage.setItem('civnexa_auth_session', 'active');
  window.sessionStorage.setItem('civnexa_current_user', JSON.stringify(user));

  return render(
    <MemoryRouter initialEntries={[initialRoute]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider defaultAuthenticated={true}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('FE-3 Case Management, Grievance Submission & Investigation Workflows', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    caseService.resetMockData();
  });

  // 1. Case Registry Tests
  describe('Case Management Registry', () => {
    it('renders case registry with table columns, search bar, and action buttons', async () => {
      renderWithProviders('/cases');

      expect(await screen.findByText('Case Management Registry')).toBeDefined();
      expect(screen.getByPlaceholderText(/Search by case reference, student, department/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeDefined();
      expect(screen.getByRole('link', { name: /New Incident/i })).toBeDefined();

      // Check table column headers (wait for async table load)
      expect(await screen.findByText('Case ID')).toBeDefined();
      expect(screen.getByText('Incident Title')).toBeDefined();
      expect(screen.getByText('Student Details')).toBeDefined();
      expect(screen.getByText('Priority')).toBeDefined();
      expect(screen.getByText('Status')).toBeDefined();
    });

    it('searches cases by student name, roll number, and case reference', async () => {
      renderWithProviders('/cases');
      const searchInput = await screen.findByPlaceholderText(/Search by case reference, student, department/i);

      // Search by student roll number
      fireEvent.change(searchInput, { target: { value: '22CSE041' } });
      await waitFor(() => {
        expect(screen.getAllByText('Aarav Sharma').length).toBeGreaterThan(0);
        expect(screen.queryByText('Rohan Varma')).toBeNull();
      });

      // Clear search and search by case reference
      const clearBtn = screen.getByLabelText(/Clear search input/i);
      fireEvent.click(clearBtn);
      fireEvent.change(searchInput, { target: { value: 'CX-2026-0102' } });

      await waitFor(() => {
        expect(screen.getAllByText('Rohan Varma').length).toBeGreaterThan(0);
        expect(screen.queryByText('Aarav Sharma')).toBeNull();
      });
    });

    it('filters cases by quick filter chips', async () => {
      renderWithProviders('/cases');

      // Click "Pending Verification" quick filter
      const pendingChip = await screen.findByRole('button', { name: /Pending Verification/i });
      fireEvent.click(pendingChip);

      await waitFor(() => {
        expect(screen.getByText(/Vandalism and laboratory equipment damage/i)).toBeDefined();
        // Resolved case should be filtered out
        expect(screen.queryByText(/Hostel curfew violation and unauthorized guest/i)).toBeNull();
      });

      // Click "All Cases" quick filter to reset
      const allChip = screen.getByRole('button', { name: /All Cases/i });
      fireEvent.click(allChip);

      await waitFor(() => {
        expect(screen.getByText(/Hostel curfew violation/i)).toBeDefined();
      });
    });

    it('enforces role-based visibility scoping for students', async () => {
      const studentUser = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithProviders('/cases', studentUser);

      // Student Aarav Sharma should only see cases pertaining to him (CX-2026-0101 and CX-2026-0106)
      await waitFor(() => {
        expect(screen.getAllByText('Aarav Sharma').length).toBeGreaterThan(0);
        // Other students' incidents should be filtered out from student view
        expect(screen.queryByText('Tanmay Deshmukh')).toBeNull();
      });
    });
  });

  // 2. Case Creation Wizard Tests
  describe('Case Creation Workflow', () => {
    it('navigates through 4-step case creation wizard and validates required fields', async () => {
      const facultyUser = MOCK_USERS.find((u) => u.role === 'FACULTY');
      renderWithProviders('/cases/create', facultyUser);

      expect(await screen.findByText('Report Campus Incident')).toBeDefined();
      expect(screen.getByText('Step 1: Identify Student Record')).toBeDefined();

      // Attempt to continue without student selection
      const continueBtn = screen.getByRole('button', { name: /Continue/i });
      fireEvent.click(continueBtn);

      expect(await screen.findByText(/Please search and select a verified student record/i)).toBeDefined();

      // Search student by name
      const searchInput = screen.getByPlaceholderText(/Type student name/i);
      fireEvent.change(searchInput, { target: { value: 'Priya' } });

      const selectBtn = await screen.findByRole('button', { name: /^Select$/i });
      fireEvent.click(selectBtn);

      // Verify selected student preview
      expect(screen.getByText('Verified Scholar')).toBeDefined();
      expect(screen.getByText('21ME019')).toBeDefined();

      // Proceed to Step 2: Incident Details
      fireEvent.click(continueBtn);
      expect(await screen.findByText('Step 2: Incident Details & Classification')).toBeDefined();

      // Fill incident form
      const titleInput = screen.getByLabelText(/Incident Title \/ Headline/i);
      const descInput = screen.getByLabelText(/Detailed Incident Narrative/i);
      const locationInput = screen.getByLabelText(/Incident Location/i);

      fireEvent.change(titleInput, { target: { value: 'Unapproved lab apparatus testing after hours' } });
      fireEvent.change(descInput, {
        target: {
          value: 'Student conducted unauthorized heat transfer experiments without proctor supervision in Thermal Lab 102.',
        },
      });
      fireEvent.change(locationInput, { target: { value: 'Thermal Engineering Lab 102' } });

      // Proceed to Step 3: Evidence Intake
      fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
      expect(await screen.findByText('Step 3: Evidence & Supporting Attachments')).toBeDefined();

      // Proceed to Step 4: Review and Submit
      fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
      expect(await screen.findByText('Step 4: Review Case Docket & Submit')).toBeDefined();
      expect(screen.getByText('Unapproved lab apparatus testing after hours')).toBeDefined();
      expect(screen.getByText('Priya Nair')).toBeDefined();

      // Submit Docket
      const submitBtn = screen.getByRole('button', { name: /Submit Incident Report/i });
      fireEvent.click(submitBtn);

      // Expect success screen
      expect(await screen.findByText('Incident Docket Successfully Logged')).toBeDefined();
      expect(screen.getByText('Pending Verification')).toBeDefined();
      expect(screen.getByText('View Case Details')).toBeDefined();
    });

    it('searches student records correctly via helper function', () => {
      const results = searchStudents('22CSE041');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Aarav Sharma');

      const byDept = searchStudents('Biotechnology');
      expect(byDept.length).toBeGreaterThan(0);
      expect(byDept[0].departmentCode).toBe('BT');
    });
  });

  // 3. Student Grievance Submission Tests
  describe('Student Grievance Submission', () => {
    it('submits student grievance and enforces anonymous toggle rules', async () => {
      const studentUser = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithProviders('/grievances/raise', studentUser);

      expect(await screen.findByText('Lodge Institutional Grievance')).toBeDefined();

      // By default ACADEMIC_GRIEVANCE is selected, which does not allow anonymous submission
      expect(screen.queryByLabelText(/Submit as Confidential Anonymous Grievance/i)).toBeNull();

      // Switch category to CAMPUS_SAFETY, which supports anonymous submission
      const categorySelect = screen.getByLabelText(/Grievance Category/i);
      fireEvent.change(categorySelect, { target: { value: 'CAMPUS_SAFETY' } });

      // Anonymous toggle should now be visible
      const anonToggle = await screen.findByLabelText(/Submit as Confidential Anonymous Grievance/i);
      expect(anonToggle).toBeDefined();
      fireEvent.click(anonToggle);

      // Fill form fields
      const subjectInput = screen.getByLabelText(/Grievance Subject \/ Headline/i);
      const descInput = screen.getByLabelText(/Detailed Grievance Narrative/i);

      fireEvent.change(subjectInput, { target: { value: 'Unsafe hallway lighting near hostel pathway' } });
      fireEvent.change(descInput, {
        target: {
          value: 'Streetlamps near hostel path 3 have been non-functional for 5 consecutive nights creating safety concerns.',
        },
      });

      // Submit
      const submitBtn = screen.getByRole('button', { name: /Submit Formal Grievance/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText('Grievance Lodged Successfully')).toBeDefined();
      expect(screen.getByText('Confidential Anonymous')).toBeDefined();
      expect(screen.getByText('Pending Verification')).toBeDefined();
    });
  });

  // 4. Verification Queue Tests
  describe('Verification Queue & Governance', () => {
    it('renders verification queue for Dean and allows verification decision', async () => {
      const deanUser = MOCK_USERS.find((u) => u.role === 'DEAN');
      renderWithProviders('/dean/verification', deanUser);

      expect(await screen.findByText('Dean & Proctorial Verification Queue')).toBeDefined();
      expect(screen.getByText(/Pending Review/i)).toBeDefined();

      // Open action modal for the first pending case
      const actionButtons = await screen.findAllByRole('button', { name: /Action/i });
      expect(actionButtons.length).toBeGreaterThan(0);
      fireEvent.click(actionButtons[0]);

      expect(await screen.findByText(/Verification Action:/i)).toBeDefined();

      // Verify case
      const confirmBtn = screen.getByRole('button', { name: /Confirm Decision/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Verification Action:/i)).toBeNull();
      });
    });

    it('requires mandatory reason when rejecting an incident in verification queue', async () => {
      const deanUser = MOCK_USERS.find((u) => u.role === 'DEAN');
      renderWithProviders('/dean/verification', deanUser);

      const actionButtons = await screen.findAllByRole('button', { name: /Action/i });
      fireEvent.click(actionButtons[0]);

      // Select Reject Incident
      const rejectBtn = await screen.findByRole('button', { name: /Reject Incident/i });
      fireEvent.click(rejectBtn);

      expect(screen.getByLabelText(/Mandatory Policy Rejection Reason/i)).toBeDefined();
    });
  });

  // 5. Case Detail & Investigation Workflow Tests
  describe('Case Details & Investigation Workflow', () => {
    it('renders full case details with 6 tabs and metadata', async () => {
      const deanUser = MOCK_USERS.find((u) => u.role === 'DEAN');
      renderWithProviders('/cases/CX-2026-0101', deanUser);

      expect(await screen.findByText('CX-2026-0101')).toBeDefined();
      expect(screen.getByText('Unauthorized electronic device detected during End-Semester Examination')).toBeDefined();

      // Verify presence of all 6 tabs
      expect(screen.getByRole('button', { name: /Case Overview/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Timeline & Milestones/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Evidence & Files/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Investigation & Hearings/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Student Explanations/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Audit Activity Log/i })).toBeDefined();
    });

    it('records an investigation note interactively', async () => {
      const deanUser = MOCK_USERS.find((u) => u.role === 'DEAN');
      renderWithProviders('/cases/CX-2026-0101', deanUser);

      // Open Add Note modal
      const addNoteBtn = await screen.findByRole('button', { name: /Add Note/i });
      fireEvent.click(addNoteBtn);

      expect(await screen.findByText('Add Confidential Investigation Note')).toBeDefined();
      const textarea = screen.getByLabelText(/Inquiry Observation \/ Note/i);
      fireEvent.change(textarea, { target: { value: 'Invigilator log cross-referenced with seating chart successfully.' } });

      const saveBtn = screen.getByRole('button', { name: /Save Note/i });
      fireEvent.click(saveBtn);

      // Switch to Investigation tab and verify note appears
      const investigationTab = screen.getByRole('button', { name: /Investigation & Hearings/i });
      fireEvent.click(investigationTab);

      expect(await screen.findByText(/Invigilator log cross-referenced with seating chart successfully/i)).toBeDefined();
    });

    it('schedules a hearing and records activity log', async () => {
      const deanUser = MOCK_USERS.find((u) => u.role === 'DEAN');
      renderWithProviders('/cases/CX-2026-0101', deanUser);

      const scheduleBtn = await screen.findByRole('button', { name: /Schedule Hearing/i });
      fireEvent.click(scheduleBtn);

      expect(await screen.findByText('Schedule Disciplinary Committee Hearing')).toBeDefined();
      const confirmBtn = screen.getByRole('button', { name: /Confirm & Issue Notice/i });
      fireEvent.click(confirmBtn);

      // Switch to Activity Log tab
      const activityTab = await screen.findByRole('button', { name: /Audit Activity Log/i });
      fireEvent.click(activityTab);

      expect((await screen.findAllByText('Hearing Scheduled')).length).toBeGreaterThan(0);
    });
  });

  // 6. Student Explanation Response Workflow
  describe('Student Explanation Workflow', () => {
    it('allows student to lodge defense for case awaiting response', async () => {
      const studentUser = MOCK_USERS.find((u) => u.role === 'STUDENT');
      // Case CX-2026-0106 is AWAITING_RESPONSE for Aarav Sharma
      renderWithProviders('/cases/CX-2026-0106', studentUser);

      expect(await screen.findByText('CX-2026-0106')).toBeDefined();
      expect(screen.getByText('Awaiting Student Response')).toBeDefined();

      const submitDefenseBtn = screen.getByRole('button', { name: /Submit Defense Explanation/i });
      fireEvent.click(submitDefenseBtn);

      expect(await screen.findByText('Submit Defense Statement & Explanation')).toBeDefined();
      const statementInput = screen.getByLabelText(/Written Explanation & Representation/i);
      fireEvent.change(statementInput, {
        target: {
          value: 'I was present in block 2 solely to return academic lecture notes to my junior mentee. I engaged in no ragging activities whatsoever.',
        },
      });

      const submitBtn = screen.getByRole('button', { name: /Submit Formal Defense/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        // Status updates to Under Investigation after submission
        expect(screen.getByText('Under Investigation')).toBeDefined();
      });
    });

    it('renders student inquiry summons portal and defense submission on /student/responses', async () => {
      const studentUser = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithProviders('/student/responses', studentUser);

      expect(await screen.findByText('Student Inquiry Summons & Explanations')).toBeDefined();
      expect(await screen.findByText('Active Summons & Prior Responses')).toBeDefined();
      expect(await screen.findByText('CX-2026-0106')).toBeDefined();
      expect(screen.getByRole('button', { name: /Submit Defense/i })).toBeDefined();
    });
  });
});
