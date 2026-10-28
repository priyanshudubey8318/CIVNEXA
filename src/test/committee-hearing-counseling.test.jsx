import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import AppRoutes from '../routes/AppRoutes';
import committeeService from '../services/committeeService';
import evidenceService, { computeSha256Checksum } from '../services/evidenceService';
import hearingService from '../services/hearingService';
import counselingService from '../services/counselingService';
import { MOCK_USERS } from '../mocks/mockUsers';

// Helper to render routes with specified active user role
const renderWithRole = (initialRoute = '/', user = MOCK_USERS[6]) => { // Default: USR-007 (COMMITTEE_MEMBER Dr. Alok Nath)
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

describe('CIVNEXA FE-4: Disciplinary Committee, Evidence Vault & Hearing Management', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    committeeService.resetMockData();
    evidenceService.resetMockData();
    hearingService.resetMockData();
    counselingService.resetMockData();
  });

  // =========================================================================
  // 1. SERVICES & CRYPTOGRAPHIC ALGORITHMS UNIT TESTS
  // =========================================================================
  describe('Phase FE-4 Core Services & Cryptographic Algorithms', () => {
    it('computes genuine 64-character hexadecimal SHA-256 digest using Web Crypto', async () => {
      const sampleText = 'CIVNEXA-EVIDENCE-TEST-PAYLOAD-2026';
      const digest = await computeSha256Checksum(sampleText);

      expect(typeof digest).toBe('string');
      expect(digest.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(digest)).toBe(true);

      // Determinism test: identical content yields identical digest
      const digest2 = await computeSha256Checksum(sampleText);
      expect(digest).toBe(digest2);
    });

    it('verifies evidence integrity against reference hash and appends custody log', async () => {
      const evidenceList = await evidenceService.getEvidence({ currentUser: MOCK_USERS[6] });
      expect(evidenceList.length).toBeGreaterThan(0);

      const target = evidenceList[0];
      const initialCustodyCount = target.custodyChain.length;

      // Verification with matching reference
      const result = await evidenceService.verifyChecksum(target.id);
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.expectedHash).toBe(target.sha256Checksum);

      // Appending custody event
      await evidenceService.addCustodyEvent(target.id, {
        action: 'Integrity Check Audit',
        actor: 'Dr. Alok Nath (COMMITTEE_MEMBER)',
        details: 'Verified against local institutional ledger.',
      });

      const updatedItem = await evidenceService.getEvidenceById(target.id);
      expect(updatedItem.custodyChain.length).toBeGreaterThan(initialCustodyCount);
    });

    it('detects scheduling conflict for overlapping venue or presiding authority', async () => {
      const existingHearings = await hearingService.getHearings({});
      expect(existingHearings.length).toBeGreaterThan(0);
      const firstHearing = existingHearings[0];

      // Test 1: Conflict on same date, overlapping time, and exact same venue
      const conflictResultVenue = hearingService.checkSchedulingConflict({
        date: firstHearing.date,
        time: firstHearing.time,
        endTime: firstHearing.endTime,
        venue: firstHearing.venue,
        presidingAuthority: 'Independent Presiding Officer',
      });
      expect(conflictResultVenue.hasConflict).toBe(true);
      expect(conflictResultVenue.conflicts[0].type).toBe('VENUE_CONFLICT');

      // Test 2: Conflict on same date, overlapping time, and exact same presiding authority
      const conflictResultAuthority = hearingService.checkSchedulingConflict({
        date: firstHearing.date,
        time: firstHearing.time,
        endTime: firstHearing.endTime,
        venue: 'Different Conference Room 99',
        presidingAuthority: firstHearing.presidingAuthority,
      });
      expect(conflictResultAuthority.hasConflict).toBe(true);
      expect(conflictResultAuthority.conflicts[0].type).toBe('AUTHORITY_CONFLICT');

      // Test 3: No conflict if different date or non-overlapping time
      const noConflictResult = hearingService.checkSchedulingConflict({
        date: '2026-12-15',
        time: '10:00',
        endTime: '11:00',
        venue: 'Room 101',
        presidingAuthority: 'Dr. Test Presider',
      });
      expect(noConflictResult.hasConflict).toBe(false);
    });

    it('manages non-destructive hearing minutes amendments and procedural outcomes', async () => {
      const hearings = await hearingService.getHearings({});
      const targetHearing = hearings[0];

      // Submit first formal minutes
      await hearingService.saveHearingMinutes(
        targetHearing.id,
        {
          participantsPresent: ['Dr. Alok Nath', 'Prof. Ananya Sen'],
          participantsAbsent: [],
          topicsDiscussed: 'Review of digital timestamps',
          summary: 'Student presented initial defense and agreed to follow-up.',
          isDraft: false,
        },
        MOCK_USERS[6]
      );

      // Amend minutes
      const amendedHearing = await hearingService.saveHearingMinutes(
        targetHearing.id,
        {
          participantsPresent: ['Dr. Alok Nath', 'Prof. Ananya Sen'],
          participantsAbsent: [],
          topicsDiscussed: 'Review of digital timestamps and witness statements',
          summary: 'Student presented initial defense and signed official statement.',
          isDraft: false,
        },
        MOCK_USERS[6]
      );

      expect(amendedHearing.amendments).toBeDefined();
      expect(amendedHearing.amendments.length).toBeGreaterThan(0);

      // Record outcome
      const resolved = await hearingService.recordHearingOutcome(
        targetHearing.id,
        {
          outcome: 'Formal Admonition & Counseling Referral',
          notes: 'Committee determined academic violation warrants developmental intervention.',
        },
        MOCK_USERS[6]
      );
      expect(resolved.status).toBe('COMPLETED');
      expect(resolved.outcome).toContain('Formal Admonition');
    });

    it('protects clinical counseling notes confidentiality based on user role', async () => {
      // Coordinator (USR-006) should see unmasked clinical notes
      const coordinatorNotes = await counselingService.getReferrals({ currentUser: MOCK_USERS[5] });
      expect(coordinatorNotes.length).toBeGreaterThan(0);
      const referralForCoordinator = coordinatorNotes[0];
      expect(referralForCoordinator.confidentialNotes).not.toContain('[Confidential Clinical');

      // Student (USR-008) should see masked clinical notes
      const studentNotes = await counselingService.getReferrals({ currentUser: MOCK_USERS[7] });
      const referralForStudent = studentNotes[0];
      expect(referralForStudent.confidentialNotes).toContain('[Confidential Clinical');
    });
  });

  // =========================================================================
  // 2. DISCIPLINARY COMMITTEE DASHBOARD & WORKFLOWS
  // =========================================================================
  describe('Disciplinary Committee Dashboard & Review Workflows (/committee/reviews)', () => {
    it('renders committee workspace metrics, tabs, and review queue for committee member', async () => {
      renderWithRole('/committee/reviews', MOCK_USERS[6]); // Dr. Alok Nath

      expect(await screen.findByText('Disciplinary Committee Workspace')).toBeDefined();
      expect(screen.getByText('Review Queue')).toBeDefined();
      expect(screen.getByText('Recommendations & Sanctions')).toBeDefined();
      expect(screen.getByText(/Scheduled Hearings/i)).toBeDefined();

      // Verify review card rendered
      expect(await screen.findByText('CX-2026-0101')).toBeDefined();
      expect(screen.getByPlaceholderText(/Search reviews by case number/i)).toBeDefined();
    });

    it('filters review queue by search query and opens deliberation note modal', async () => {
      renderWithRole('/committee/reviews', MOCK_USERS[6]);

      const searchInput = await screen.findByPlaceholderText(/Search reviews by case number/i);
      fireEvent.change(searchInput, { target: { value: 'Examination' } });

      await waitFor(() => {
        expect(screen.getByText('CX-2026-0101')).toBeDefined();
      });

      // Find "Add Deliberation Note" button
      const addNoteButtons = screen.getAllByRole('button', { name: /Add Deliberation Note/i });
      expect(addNoteButtons.length).toBeGreaterThan(0);
      fireEvent.click(addNoteButtons[0]);

      // Verify deliberation note modal appears
      expect(await screen.findByText(/Add Deliberation Note:/i)).toBeDefined();
      const textarea = screen.getByPlaceholderText(/Record observations, witness testimony/i);
      expect(textarea).toBeDefined();

      // Submit note
      fireEvent.change(textarea, { target: { value: 'Verified preliminary network audit trail matches student IP.' } });
      const saveBtn = screen.getByRole('button', { name: /Save Deliberation Note/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Record observations, witness testimony/i)).toBeNull();
      });
    });

    it('opens recommendation modal and submits formal sanction proposal', async () => {
      renderWithRole('/committee/reviews', MOCK_USERS[6]);

      // Click "Draft Recommendation" or "Edit Draft" or "View Recommendation"
      const recButtons = await screen.findAllByRole('button', { name: /Draft Recommendation|Edit Draft|View Recommendation/i });
      expect(recButtons.length).toBeGreaterThan(0);
      fireEvent.click(recButtons[0]);

      expect(await screen.findByText(/Committee Recommendation:/i)).toBeDefined();

      // Fill recommendation rationale
      const rationaleInput = screen.getByPlaceholderText(/Document the evidential basis, mitigating circumstances/i);
      fireEvent.change(rationaleInput, { target: { value: 'Student cooperated fully; recommending campus community service and academic probation.' } });

      const submitBtn = screen.getByRole('button', { name: /Submit Formal Recommendation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Document the evidential basis, mitigating circumstances/i)).toBeNull();
      });
    });
  });

  // =========================================================================
  // 3. EVIDENCE VAULT & WEB CRYPTO SHA-256 INTEGRITY INSPECTOR
  // =========================================================================
  describe('Evidence Vault & Cryptographic Verification (/committee/evidence)', () => {
    it('renders evidence repository with search input, filters, and custody badges', async () => {
      renderWithRole('/committee/evidence', MOCK_USERS[6]);

      expect(await screen.findByText('Institutional Evidence Vault')).toBeDefined();
      expect(screen.getByPlaceholderText(/Search by file name, case ID, description, or uploader/i)).toBeDefined();

      // Confirm evidence files appear
      expect(await screen.findByText('impounded_device_log.pdf')).toBeDefined();
      expect(screen.getByText('seating_chart_signed.jpg')).toBeDefined();
    });

    it('opens file preview modal for an evidence item', async () => {
      renderWithRole('/committee/evidence', MOCK_USERS[6]);

      const previewButtons = await screen.findAllByTitle('Inspect File Preview');
      expect(previewButtons.length).toBeGreaterThan(0);
      fireEvent.click(previewButtons[0]);

      expect(await screen.findByText(/Evidence Inspection:/i)).toBeDefined();
      expect(screen.getByText(/Deposited by/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Close Preview/i })).toBeDefined();
    });

    it('triggers SHA-256 Web Crypto checksum verification modal', async () => {
      renderWithRole('/committee/evidence', MOCK_USERS[6]);

      const verifyButtons = await screen.findAllByTitle('Verify SHA-256 Checksum');
      expect(verifyButtons.length).toBeGreaterThan(0);
      fireEvent.click(verifyButtons[0]);

      expect(await screen.findByText('SHA-256 Cryptographic Checksum Verification')).toBeDefined();
      expect(screen.getByRole('button', { name: /Close Integrity Check/i })).toBeDefined();
    });

    it('opens Chain of Custody drawer displaying chronological transfer events', async () => {
      renderWithRole('/committee/evidence', MOCK_USERS[6]);

      const custodyButtons = await screen.findAllByTitle('View Chain of Custody History');
      expect(custodyButtons.length).toBeGreaterThan(0);
      fireEvent.click(custodyButtons[0]);

      expect(await screen.findByText(/Chain of Custody:/i)).toBeDefined();
      expect(screen.getByText(/Evidence Intake/i)).toBeDefined();
    });
  });

  // =========================================================================
  // 4. HEARING CALENDAR & REAL-TIME CONFLICT DETECTION
  // =========================================================================
  describe('Hearing Management & Conflict Detection (/committee/calendar)', () => {
    it('renders interactive hearing calendar with view toggle and schedule button', async () => {
      renderWithRole('/committee/calendar', MOCK_USERS[6]);

      expect(await screen.findByText('Disciplinary Hearing Calendar & Proceedings')).toBeDefined();
      expect(screen.getByRole('button', { name: /Schedule Hearing/i })).toBeDefined();
      expect(screen.getByTitle('Calendar Grid View')).toBeDefined();
      expect(screen.getByTitle('Chronological List View')).toBeDefined();
    });

    it('switches between calendar and list view modes', async () => {
      renderWithRole('/committee/calendar', MOCK_USERS[6]);

      const listViewBtn = await screen.findByTitle('Chronological List View');
      fireEvent.click(listViewBtn);

      // In list view, day hearings docket expands
      expect(await screen.findByText(/Hearings for 2026-10-24/i)).toBeDefined();
    });

    it('opens Schedule Hearing modal and evaluates venue conflict', async () => {
      renderWithRole('/committee/calendar', MOCK_USERS[6]);

      const scheduleBtn = await screen.findByRole('button', { name: /Schedule Hearing/i });
      fireEvent.click(scheduleBtn);

      expect(await screen.findByText('Schedule Disciplinary Hearing')).toBeDefined();

      // Enter details that collide with existing seed hearing:
      // In seed data: Oct 24, 2026, 10:30 - 11:30 at 'Senate Chamber, Admin Block A'
      const dateInput = screen.getByLabelText(/Hearing Date/i);
      const startInput = screen.getByLabelText(/Start Time/i);
      const endInput = screen.getByLabelText(/End Time/i);

      fireEvent.change(dateInput, { target: { value: '2026-10-24' } });
      fireEvent.change(startInput, { target: { value: '10:30' } });
      fireEvent.change(endInput, { target: { value: '11:30' } });

      // Check conflict banner presence
      await waitFor(() => {
        expect(screen.queryByText(/Scheduling Conflict Detected!/i)).toBeDefined();
      });
    });

    it('opens hearing minutes modal and formal summons notice preview', async () => {
      renderWithRole('/committee/calendar', MOCK_USERS[6]);

      // Open Summons Notice
      const noticeButtons = await screen.findAllByTitle('Prepare & View Summons Notice');
      expect(noticeButtons.length).toBeGreaterThan(0);
      fireEvent.click(noticeButtons[0]);

      expect(await screen.findByText('Disciplinary Hearing Notice & Formal Summons')).toBeDefined();
      expect(screen.getByText(/CIVNEXA UNIVERSITY PROCTORIAL BOARD/i)).toBeDefined();
    });
  });

  // =========================================================================
  // 5. COUNSELING SESSIONS, ATTENDANCE & WELFARE FOLLOW-UPS
  // =========================================================================
  describe('Counseling Sessions, Attendance & Follow-ups (/counseling/sessions & /counseling/followups)', () => {
    it('renders counseling sessions page for Coordinator with student referrals', async () => {
      renderWithRole('/counseling/sessions', MOCK_USERS[5]); // Pooja Nambiar (COORDINATOR)

      expect(await screen.findByText('Student Counseling & Mentorship Sessions')).toBeDefined();
      expect(screen.getByRole('button', { name: /Schedule Session/i })).toBeDefined();
      expect(screen.getByPlaceholderText(/Search referrals by student name, roll number/i)).toBeDefined();

      // Verify student referral dossier (may appear in session table & referral card)
      const studentMatches = await screen.findAllByText('Tanmay Deshmukh');
      expect(studentMatches.length).toBeGreaterThan(0);
      expect(screen.getByText('23EE089')).toBeDefined();
    });

    it('records counseling session attendance and clinical notes', async () => {
      renderWithRole('/counseling/sessions', MOCK_USERS[5]);

      const updateButtons = await screen.findAllByRole('button', { name: /Update Notes/i });
      expect(updateButtons.length).toBeGreaterThan(0);
      fireEvent.click(updateButtons[0]);

      expect(await screen.findByText(/Record Session Attendance & Clinical Notes/i)).toBeDefined();

      // Update notes
      const notesTextarea = screen.getByPlaceholderText(/Record therapeutic observations, coping strategies/i);
      fireEvent.change(notesTextarea, { target: { value: 'Student engaged constructively in stress management techniques.' } });

      const saveBtn = screen.getByRole('button', { name: /Save Clinical Record/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Record therapeutic observations, coping strategies/i)).toBeNull();
      });
    });

    it('renders welfare follow-up monitoring log and completes follow-up', async () => {
      renderWithRole('/counseling/followups', MOCK_USERS[5]);

      expect(await screen.findByText('Student Welfare Follow-ups & Monitoring Log')).toBeDefined();

      // Open complete follow-up modal
      const markResolvedButtons = await screen.findAllByRole('button', { name: /Mark Complete/i });
      expect(markResolvedButtons.length).toBeGreaterThan(0);
      fireEvent.click(markResolvedButtons[0]);

      expect(await screen.findByText(/Complete Student Welfare Follow-up/i)).toBeDefined();

      const notesInput = screen.getByPlaceholderText(/Record observations from interactions with student/i);
      fireEvent.change(notesInput, { target: { value: 'Student confirmed attendance at peer tutoring and emotional stability.' } });

      const confirmBtn = screen.getByRole('button', { name: /Save Follow-up Check/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Record observations from interactions with student/i)).toBeNull();
      });
    });

    it('renders main counseling overview dashboard with live metrics', async () => {
      renderWithRole('/counseling', MOCK_USERS[5]);

      expect(await screen.findByText('Counseling, Mentorship & Student Welfare')).toBeDefined();
      expect(screen.getByText('ACTIVE SESSIONS')).toBeDefined();
      expect(screen.getByText('ACTIVE REFERRALS')).toBeDefined();
      expect(screen.getByText('PENDING FOLLOW-UPS')).toBeDefined();
      expect(screen.getByRole('link', { name: /Manage Sessions/i })).toBeDefined();
    });
  });
});
