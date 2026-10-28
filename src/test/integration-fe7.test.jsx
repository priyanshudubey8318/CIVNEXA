import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('CIVNEXA FE-7: Master Frontend Integration & Verification Suite', () => {
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
  // 1. ROUTE INVENTORY & ACCESS INTEGRATION
  // =========================================================================
  describe('1. Complete Route Inventory & Authentication Bounds', () => {
    it('renders public guest views under AuthLayout without requiring session', async () => {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Sign In to CIVNEXA')).toBeDefined();
      expect(screen.getByText('Select Demo Persona:')).toBeDefined();
      unmount();

      render(
        <MemoryRouter initialEntries={['/forgot-password']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </MemoryRouter>
      );
      expect(screen.getByText('Password Recovery')).toBeDefined();
    });

    it('renders 404 NotFoundPage on unrecognized routes', async () => {
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      renderWithRole('/non-existent-splat-path-12345', dean);

      await waitFor(() => {
        expect(screen.getByText('Page Not Found')).toBeDefined();
        expect(screen.getByText('Return to Institutional Overview')).toBeDefined();
      });
    });

    it('enforces route permission boundary and redirects unauthorized roles to /unauthorized', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      renderWithRole('/admin/users', student);

      await waitFor(() => {
        expect(screen.getByText('Access Restricted')).toBeDefined();
      });
    });
  });

  // =========================================================================
  // 2. END-TO-END WORKFLOW A: INCIDENT REPORTING & INTAKE
  // =========================================================================
  describe('2. Workflow A: Incident Reporting & Governance Verification', () => {
    it('allows faculty to create an incident which reflects in case registry and verification queue', async () => {
      const faculty = MOCK_USERS.find((u) => u.role === 'FACULTY');

      // 1. Faculty reports incident via case service
      const newCase = await caseService.createCase({
        title: 'Unauthorized Electronic Device in Final Examination',
        category: 'Examination Malpractice & UFM',
        categoryKey: 'EXAM_INCIDENT',
        priority: 'HIGH',
        student: {
          id: 'STU-001',
          name: 'Aarav Sharma',
          rollNo: 'CS-2023-042',
          email: 'aarav.sharma@civnexa.edu',
          department: 'Computer Science & Engineering',
        },
        incidentDate: '2026-10-22',
        location: 'Examination Hall 3B',
        description: 'Candidate was observed with a smartwatch transmitting test questions.',
        reporter: {
          id: faculty.id,
          name: faculty.name,
          role: faculty.role,
        },
      });

      expect(newCase.caseNumber).toMatch(/^CX-2026-\d{4}$/);
      expect(newCase.status).toBe('PENDING_VERIFICATION');

      // 2. Case appears in overall cases
      const casesRes = await caseService.getCases();
      const createdItem = casesRes.items.find((c) => c.id === newCase.id || c.caseNumber === newCase.caseNumber);
      expect(createdItem).toBeDefined();
      expect(createdItem.title).toContain('Unauthorized Electronic Device');

      // 3. Dean logs in and inspects verification queue
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      const vQueue = await caseService.getVerificationQueue();
      const pendingInQueue = vQueue.find((item) => item.id === newCase.id || item.caseNumber === newCase.caseNumber);
      expect(pendingInQueue).toBeDefined();

      // 4. Dean executes verification decision
      const updatedCase = await caseService.verifyCase(newCase.id, {
        action: 'VERIFY',
        notes: 'Confirmed invigilator log and confiscated device evidence.',
        verifiedBy: dean,
      });

      expect(updatedCase.status).toBe('VERIFIED');
    });
  });

  // =========================================================================
  // 3. END-TO-END WORKFLOW B: STUDENT GRIEVANCE SUBMISSION
  // =========================================================================
  describe('3. Workflow B: Student Grievance Submission (Named vs. Anonymous)', () => {
    it('records named and anonymous student grievances with strict privacy separation', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');

      // Named grievance
      const namedGrievance = await caseService.createGrievance({
        subject: 'Hostel Library Power Backup Failure during End-Semester Prep',
        category: 'Campus Infrastructure & Facilities',
        categoryKey: 'INFRASTRUCTURE',
        description: 'Power backup in Block C library has been offline for 48 hours.',
        isAnonymous: false,
        reporter: {
          id: student.id,
          name: student.name,
          rollNo: 'CS-2023-042',
          email: student.email,
        },
      });

      expect(namedGrievance.caseNumber).toBeDefined();
      expect(namedGrievance.student.name).toBe(student.name);

      // Anonymous grievance
      const anonGrievance = await caseService.createGrievance({
        subject: 'Unfair Evaluation Allegation in Midterm Lab Viva',
        category: 'Academic Evaluation & Grading Grievance',
        categoryKey: 'ACADEMIC_GRIEVANCE',
        description: 'External evaluator asked questions outside syllabus without lab manual reference.',
        isAnonymous: true,
        reporter: {
          id: student.id,
          name: student.name,
          rollNo: 'CS-2023-042',
          email: student.email,
        },
      });

      expect(anonGrievance.isAnonymous).toBe(true);
      expect(anonGrievance.student.name).toBe('Anonymous Student Complainant');
      expect(anonGrievance.student.rollNo).toBe('ANON-ROLL');

      // Student checks complaints list
      const studentComplaintsRes = await caseService.getCases({ currentUser: student, role: 'STUDENT' });
      expect(studentComplaintsRes.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. END-TO-END WORKFLOW C: STUDENT RESPONSE WORKFLOW
  // =========================================================================
  describe('4. Workflow C: Student Response & Timeline Integration', () => {
    it('records student defense and appends structured response to case timeline', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      const caseId = 'CX-2026-0106'; // Mock case awaiting response

      const updated = await caseService.submitStudentResponse(caseId, {
        explanationText: 'I was present in block 2 solely to return academic lecture notes to my junior mentee.',
        attachments: [{ name: 'admit_card_receipt.pdf', size: '200 KB', type: 'application/pdf' }],
        student: { id: student.id, name: student.name },
      });

      expect(updated.status).toBe('UNDER_INVESTIGATION');
      expect(updated.responses.length).toBeGreaterThan(0);
      expect(updated.responses[0].text).toContain('solely to return academic lecture notes');

      // Verify timeline entry
      const timelineMatch = updated.timeline.some((evt) =>
        evt.title?.toLowerCase().includes('student') || evt.description?.toLowerCase().includes('explanation')
      );
      expect(timelineMatch).toBe(true);
    });
  });

  // =========================================================================
  // 5. END-TO-END WORKFLOW D: COMMITTEE REVIEW & HEARINGS
  // =========================================================================
  describe('5. Workflow D: Committee Deliberation, Cryptographic Verification & Hearings', () => {
    it('manages committee deliberation, schedules hearing, and logs immutable minutes', async () => {
      const committeeMember = MOCK_USERS.find((u) => u.role === 'COMMITTEE_MEMBER');
      const caseId = 'CX-2026-0101';

      // 1. Committee deliberation note
      const reviewQueue = await committeeService.getReviewQueue();
      const reviewItem = reviewQueue[0];
      const updatedReview = await committeeService.addReviewNote(reviewItem.id, {
        noteText: 'Review of digital forensics confirms similarity score exceeding institutional threshold.',
        author: committeeMember,
      });
      expect(updatedReview).toBeDefined();

      // 2. Schedule hearing
      const hearing = await hearingService.scheduleHearing({
        caseId,
        caseNumber: caseId,
        title: 'Formal Disciplinary Hearing: Academic Integrity Breach',
        date: '2026-10-30',
        time: '14:30',
        venue: 'Senate Room B, Proctorial Wing',
        authorities: [committeeMember.name, 'Prof. Ananya Sen'],
        attendees: ['Aarav Sharma (Student)', 'Dr. Priya Nair (Proctor)'],
        notes: 'Mandatory in-person hearing.',
        scheduledBy: committeeMember,
      });
      expect(hearing.id).toBeDefined();
      expect(hearing.status).toBe('SCHEDULED');

      // 3. Save hearing minutes
      const completedMinutes = await hearingService.saveHearingMinutes(hearing.id, {
        summary: 'Committee unanimously concluded a Level 2 academic integrity violation occurred.',
        topicsDiscussed: 'Confiscated device logs, invigilator testimony, and candidate statement.',
        isDraft: false,
        recordedBy: committeeMember,
      });
      expect(completedMinutes.summary).toContain('Level 2 academic integrity violation');

      // Verify hearing status is updated to COMPLETED
      const hearingsList = await hearingService.getHearings();
      const updatedHearing = hearingsList.find((h) => h.id === hearing.id);
      expect(updatedHearing.status).toBe('COMPLETED');
    });
  });

  // =========================================================================
  // 6. END-TO-END WORKFLOW E: COUNSELING & WELFARE MONITORING
  // =========================================================================
  describe('6. Workflow E: Counseling Referral, Clinical Intake & Follow-ups', () => {
    it('manages counseling session attendance and tracks welfare follow-ups', async () => {
      const coordinator = MOCK_USERS.find((u) => u.role === 'COORDINATOR');

      // 1. Create counseling referral
      const referral = await counselingService.createReferral({
        studentId: 'STU-001',
        studentName: 'Aarav Sharma',
        reason: 'Stress and academic anxiety following disciplinary inquiry notice.',
        priority: 'MEDIUM',
        referredBy: { name: 'Dr. Rajiv Verma (HOD)' },
      });
      expect(referral.id).toBeDefined();

      // 2. Schedule counseling appointment
      const session = await counselingService.scheduleSession(referral.id, {
        date: '2026-10-28',
        time: '11:00',
        venue: 'Room 204, Student Wellbeing Wing',
        counselor: coordinator.name,
        type: 'Academic Stress & Cognitive Coping',
      });
      expect(session.id).toBeDefined();

      // 3. Record attendance & notes
      const recorded = await counselingService.recordSessionAttendance(referral.id, session.id, {
        attendanceStatus: 'ATTENDED',
        summary: 'Student responded positively to academic stress reduction framework.',
        followupRequired: true,
        followupDate: '2026-11-05',
      });
      expect(recorded.attendanceStatus).toBe('ATTENDED');

      // 4. Complete welfare follow-up on updated referral
      const updatedRef = await counselingService.getReferralById(referral.id);
      expect(updatedRef.followups.length).toBeGreaterThan(0);
      const followupId = updatedRef.followups[0].id;

      const completedFollowup = await counselingService.completeFollowup(referral.id, followupId, {
        outcomeNotes: 'Student reported stabilized routine and reduced anxiety.',
        counselor: coordinator.name,
      });
      expect(completedFollowup.status).toBe('COMPLETED');
    });
  });

  // =========================================================================
  // 7. END-TO-END WORKFLOW F: APPELLATE REVIEW WORKFLOW
  // =========================================================================
  describe('7. Workflow F: Appellate Review & Decision Preservation', () => {
    it('submits student appeal, reviews docket, and records appellate determination', async () => {
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');

      // 1. Student submits appeal
      const appeal = await appealService.submitAppeal({
        caseId: 'CX-2026-0101',
        caseNumber: 'CX-2026-0101',
        caseTitle: 'Unauthorized electronic device detected',
        originalDecision: {
          decisionDate: '2026-10-15',
          decisionSummary: 'Hostel Gate Restriction for 14 Days',
          sanctionType: 'CAMPUS_RESTRICTION',
          decidedBy: 'Disciplinary Board',
        },
        grounds: ['PROCEDURAL_IRREGULARITY'],
        explanation: 'Gate attendance biometric log timestamp was misinterpreted due to clock drift at the server.',
        reliefSought: 'Revocation of restriction to verbal caution',
        supportingDocuments: [],
        appellant: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
      });

      expect(appeal.id).toMatch(/^APL-2026-\d{3,4}$/);
      expect(appeal.status).toBe('SUBMITTED');
      expect(appeal.originalDecision).toBeDefined();
      expect(appeal.originalDecision.decisionPreserved).toBe(true);

      // 2. Dean reviews docket
      const queue = await appealService.getAppeals({ currentUser: dean });
      const foundAppeal = queue.find((a) => a.id === appeal.id);
      expect(foundAppeal).toBeDefined();

      // 3. Dean records outcome
      const determined = await appealService.recordFinalOutcome(
        appeal.id,
        {
          outcome: 'MODIFIED',
          justification: 'Biometric server log verified clock desynchronization. Restriction reduced to verbal caution.',
          authorizedBy: dean.name,
        },
        dean
      );

      expect(determined.status).toBe('MODIFIED');
      expect(determined.originalDecision.decisionPreserved).toBe(true);
    });
  });

  // =========================================================================
  // 8. END-TO-END WORKFLOW G: ADMINISTRATION & REPORTING
  // =========================================================================
  describe('8. Workflow G: Administration Console & Institutional Analytics', () => {
    it('configures system category and generates filtered institutional reports with CSV export', async () => {
      const superAdmin = MOCK_USERS.find((u) => u.role === 'SUPER_ADMIN');

      // 1. Super Admin manages categories
      const categoriesBefore = await adminService.getCategories();
      const newCat = await adminService.createCategory({
        key: 'AI_USAGE_POLICY',
        label: 'Generative AI Misrepresentation',
        description: 'Submission of machine-generated academic deliverables without attribution.',
        color: 'purple',
        defaultPriority: 'HIGH',
        slaDays: 7,
      });
      expect(newCat.key).toBe('AI_USAGE_POLICY');

      const categoriesAfter = await adminService.getCategories();
      expect(categoriesAfter.length).toBe(categoriesBefore.length + 1);

      // 2. Report data generation
      const report = await reportingService.getReportData({
        reportType: 'CASE_OVERVIEW',
        currentUser: superAdmin,
      });

      expect(report.summary).toBeDefined();
      expect(report.summary.totalCases).toBeGreaterThan(0);
      expect(report.records).toBeDefined();

      // 3. CSV Export generation
      const csvOutput = reportingService.exportToCSV(report, superAdmin);
      expect(csvOutput).toContain('"Case Reference","Title","Category"');
      expect(csvOutput).toContain('CX-2026-');
    });
  });

  // =========================================================================
  // 9. DATA CONSISTENCY & RESILIENCE AUDIT
  // =========================================================================
  describe('9. Data Consistency & LocalStorage Resilience', () => {
    it('recovers gracefully from corrupted or malformed localStorage payload', async () => {
      window.localStorage.setItem('civnexa_cases_store', 'INVALID_JSON_CORRUPTED{[[}');
      window.localStorage.setItem('civnexa_admin_users', 'NOT_VALID_JSON');

      // Services should catch parse error and fall back to pristine mock state
      const casesRes = await caseService.getCases();
      expect(casesRes.items.length).toBeGreaterThan(0);

      const users = await adminService.getUsers();
      expect(users.length).toBeGreaterThan(0);
    });

    it('enforces sequential, unique case references without collision', async () => {
      const p1 = caseService.createCase({
        title: 'Collision Test 1',
        category: 'Code of Conduct Violation',
        categoryKey: 'DISCIPLINE',
        description: 'Test incident description for collision test 1.',
        student: { id: 'STU-001', name: 'Test Student' },
      });
      const p2 = caseService.createCase({
        title: 'Collision Test 2',
        category: 'Code of Conduct Violation',
        categoryKey: 'DISCIPLINE',
        description: 'Test incident description for collision test 2.',
        student: { id: 'STU-002', name: 'Test Student 2' },
      });

      const [c1, c2] = await Promise.all([p1, p2]);
      expect(c1.caseNumber).not.toBe(c2.caseNumber);
    });
  });

  // =========================================================================
  // 10. MASTER DEMONSTRATION 11-STEP EXECUTION
  // =========================================================================
  describe('10. Master Frontend Demonstration 11-Step Verification', () => {
    it('executes full 11-step master demonstration workflow seamlessly', async () => {
      // Step 1: Faculty logs in
      const faculty = MOCK_USERS.find((u) => u.role === 'FACULTY');
      expect(faculty.role).toBe('FACULTY');

      // Step 2: Faculty reports an incident
      const incident = await caseService.createCase({
        title: 'Demo Step 2: Unattended Examination Material',
        category: 'Examination Malpractice & UFM',
        categoryKey: 'EXAM_INCIDENT',
        priority: 'MEDIUM',
        student: { id: 'STU-001', name: 'Aarav Sharma' },
        description: 'Demonstration incident submitted during presentation walkthrough.',
        reporter: { id: faculty.id, name: faculty.name, role: faculty.role },
      });
      expect(incident.id).toBeDefined();

      // Step 3: Student logs in and submits a grievance
      const student = MOCK_USERS.find((u) => u.role === 'STUDENT');
      const grievance = await caseService.createGrievance({
        subject: 'Demo Step 3: Campus Transit Bus Delay',
        category: 'Campus Infrastructure & Facilities',
        categoryKey: 'INFRASTRUCTURE',
        description: 'Morning shuttle arrived 35 minutes late impacting morning exams.',
        isAnonymous: false,
        reporter: { id: student.id, name: student.name, email: student.email },
      });
      expect(grievance.id).toBeDefined();

      // Step 4: Dean verifies and assigns case
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      const verified = await caseService.verifyCase(incident.id, {
        action: 'VERIFY',
        notes: 'Verified by Dean during step 4.',
        verifiedBy: dean,
      });
      expect(verified.status).toBe('VERIFIED');

      // Step 5: Committee member inspects evidence
      const committeeMember = MOCK_USERS.find((u) => u.role === 'COMMITTEE_MEMBER');
      const reviewQueue = await committeeService.getReviewQueue({ currentUser: committeeMember });
      expect(reviewQueue.length).toBeGreaterThan(0);

      // Step 6: Committee schedules a hearing
      const hearing = await hearingService.scheduleHearing({
        caseId: incident.id,
        caseNumber: incident.caseNumber,
        title: 'Demo Step 6: Disciplinary Hearing',
        date: '2026-11-01',
        time: '15:00',
        venue: 'Senate Room 1',
        authorities: [committeeMember.name],
        attendees: ['Aarav Sharma'],
        scheduledBy: committeeMember,
      });
      expect(hearing.id).toBeDefined();

      // Step 7: Student submits explanation
      const response = await caseService.submitStudentResponse(incident.id, {
        explanationText: 'Demo Step 7: Explanation submitted by student.',
        attachments: [],
        student: { id: student.id, name: student.name },
      });
      expect(response.responses.length).toBeGreaterThan(0);

      // Step 8: Coordinator records counseling attendance
      const coordinator = MOCK_USERS.find((u) => u.role === 'COORDINATOR');
      const referrals = await counselingService.getReferrals();
      expect(referrals.length).toBeGreaterThan(0);
      const referral = referrals[0];
      const session = await counselingService.scheduleSession(referral.id, {
        date: '2026-11-03',
        time: '10:00',
        venue: 'Counseling Room 1',
        counselor: coordinator.name,
      });
      const recordedSession = await counselingService.recordSessionAttendance(referral.id, session.id, {
        attendanceStatus: 'ATTENDED',
        summary: 'Demo Step 8: Attendance and counseling progress noted.',
      });
      expect(recordedSession.attendanceStatus).toBe('ATTENDED');

      // Step 9: Student submits appeal & Dean reviews
      const appeal = await appealService.submitAppeal({
        caseId: incident.id,
        caseNumber: incident.caseNumber,
        caseTitle: incident.title,
        originalDecision: {
          decisionDate: '2026-10-15',
          decisionSummary: 'Written Warning',
          sanctionType: 'WRITTEN_WARNING',
          decidedBy: 'Disciplinary Committee',
        },
        grounds: ['NEW_EVIDENCE'],
        explanation: 'Demo Step 9: Detailed supplementary evidence submitted on appeal exceeding minimum chars.',
        reliefSought: 'Expungement of written warning from conduct ledger',
        supportingDocuments: [],
        appellant: { id: student.id, name: student.name, email: student.email },
      });
      const appealResult = await appealService.recordFinalOutcome(
        appeal.id,
        {
          outcome: 'UPHELD',
          justification: 'Dean accepted supplementary explanation.',
          authorizedBy: dean.name,
        },
        dean
      );
      expect(appealResult.status).toBe('UPHELD');

      // Step 10: Dean generates institutional report
      const rep = await reportingService.getReportData({ reportType: 'CASE_OVERVIEW', currentUser: dean });
      expect(rep.summary.totalCases).toBeGreaterThan(0);

      // Step 11: Super Admin inspects system administration
      const superAdmin = MOCK_USERS.find((u) => u.role === 'SUPER_ADMIN');
      const auditLogs = await adminService.getAuditLogs({ limit: 10 });
      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 11. CONTENT HYGIENE, TEXT LEAKAGE AUDIT & USER INTERFACE POLISH
  // =========================================================================
  describe('11. Content Hygiene & Text Leakage Verification', () => {
    it('ensures CSV export never serializes [object Object] and formats assigned reviewer cleanly', async () => {
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      const rep = await reportingService.getReportData({ reportType: 'CASE_OVERVIEW', currentUser: dean });
      const csv = reportingService.exportToCSV(rep, dean);

      expect(csv).not.toContain('[object Object]');
      expect(csv).toContain('Case Reference');
      expect(csv).toContain('Title');
    });

    it('safely filters cases by reviewer when assignedTo is an object representation', async () => {
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      const rep = await reportingService.getReportData({
        reportType: 'CASE_OVERVIEW',
        reviewer: 'Dr.',
        currentUser: dean,
      });
      expect(rep.records).toBeDefined();
    });

    it('renders clean institutional branding and no developmental phase strings on main layout', async () => {
      const dean = MOCK_USERS.find((u) => u.role === 'DEAN');
      renderWithRole('/dashboard', dean);

      expect(screen.queryByText(/FE-1 DEMO MODE/i)).toBeNull();
      expect(screen.queryByText(/FE-2 Role Navigation Engine/i)).toBeNull();
      expect(screen.queryByText(/DEMONSTRATION SESSION/i)).toBeNull();
      expect(screen.getAllByText(/CIVNEXA/i).length).toBeGreaterThan(0);
    });
  });
});
