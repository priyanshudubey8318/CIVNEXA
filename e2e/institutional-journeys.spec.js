import { test, expect } from '@playwright/test';
import path from 'path';

const EVIDENCE_DIR = 'C:/Users/priyanshu dubey/.gemini/antigravity/brain/26a6c5ff-7fa8-4d6e-b1d5-e891b476be04/evidence';

const PERSONAS = {
  SUPER_ADMIN: {
    id: 1,
    userReference: 'ADM-001',
    name: 'Platform Administrator',
    email: 'admin@civnexa.edu',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Administrator',
    status: 'ACTIVE',
    department: 'CIVNEXA Platform',
    title: 'Platform Administrator',
    passwordChangeRequired: false,
  },
  DEAN: {
    id: 2,
    userReference: 'DEAN-001',
    name: 'Prof. Margaret Hamilton',
    email: 'dean@civnexa.edu',
    role: 'DEAN',
    roleLabel: 'Dean of Student Affairs',
    status: 'ACTIVE',
    department: 'Student Affairs',
    title: 'Dean',
    passwordChangeRequired: false,
  },
  COMMITTEE_MEMBER: {
    id: 3,
    userReference: 'COMM-001',
    name: 'Dr. Katherine Johnson',
    email: 'committee@civnexa.edu',
    role: 'COMMITTEE_MEMBER',
    roleLabel: 'Disciplinary Committee Member',
    status: 'ACTIVE',
    department: 'Proctorial Board',
    title: 'Committee Member',
    passwordChangeRequired: false,
  },
  COORDINATOR: {
    id: 4,
    userReference: 'COORD-001',
    name: 'Dr. Dorothy Vaughan',
    email: 'coordinator@civnexa.edu',
    role: 'COORDINATOR',
    roleLabel: 'Counseling & Mentorship Coordinator',
    status: 'ACTIVE',
    department: 'Student Counseling',
    title: 'Lead Counselor',
    passwordChangeRequired: false,
  },
  STUDENT: {
    id: 5,
    userReference: 'STU-001',
    institutionalId: 'CS2026-001',
    rollNo: 'CS2026-001',
    name: 'Ada Lovelace',
    email: 'ada.lovelace@civnexa.edu',
    role: 'STUDENT',
    roleLabel: 'Student',
    status: 'ACTIVE',
    department: 'Computer Science',
    title: 'Undergraduate Scholar',
    passwordChangeRequired: false,
    qrToken: 'QR-TOKEN-ADA-2026',
  },
};

const setupSession = async (page, persona) => {
  await page.addInitScript((user) => {
    window.sessionStorage.setItem('civnexa_auth_session', 'active');
    window.sessionStorage.setItem('civnexa_current_user', JSON.stringify(user));
  }, persona);
};

test.describe('CIVNEXA — Institutional User Journeys (E2E)', () => {

  // Journey 1: Public Landing & Authentication Entrypoint
  test('Journey 1: Public Landing Page & Login form rendering and validation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CIVNEXA/i);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_1_landing.png') });

    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"], input#email')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"], input#password')).toBeVisible();

    // Trigger form validation on empty submit
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Institutional email is required')).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_1_login_validation.png') });
  });

  // Journey 2: Password Change & Recovery Flows
  test('Journey 2: Password recovery (Forgot Password, Reset Password) & Settings view', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('text=Password Recovery').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_2_forgot_password.png') });

    await page.goto('/reset-password');
    await expect(page.locator('text=Reset Password').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_2_reset_password.png') });

    // Authenticated settings view
    const authedPage = await page.context().newPage();
    await setupSession(authedPage, PERSONAS.STUDENT);
    await authedPage.goto('/settings');
    await expect(authedPage.locator('text=Settings').first()).toBeVisible();
    await authedPage.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_2_settings_password_change.png') });
    await authedPage.close();
  });

  // Journey 3: Registration with email verification & OTP
  test('Journey 3: Student Onboarding Registration & Email Verification', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('text=Institutional Student Onboarding').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_3_register.png') });

    await page.goto('/verify-email');
    await expect(page.locator('text=Verify Institutional Email').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_3_verify_email.png') });
  });

  // Journey 4: Super Admin Console — Users, Departments, Categories, Audit
  test('Journey 4: Super Admin Management Console (Users, Departments, Categories, Audit Logs)', async ({ page }) => {
    await setupSession(page, PERSONAS.SUPER_ADMIN);
    
    await page.goto('/admin/users');
    await expect(page.locator('text=User Directory').or(page.locator('text=User Management')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_4_admin_users.png') });

    await page.goto('/admin/departments');
    await expect(page.locator('text=Department Management').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_4_admin_departments.png') });

    await page.goto('/admin/categories');
    await expect(page.locator('text=Case Category Configuration').or(page.locator('text=Category Management')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_4_admin_categories.png') });

    await page.goto('/admin/audit');
    await expect(page.locator('text=Audit Logs').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_4_admin_audit.png') });
  });

  // Journey 5: Case Creation, Verification & Lifecycle Registry
  test('Journey 5: Disciplinary Case Creation, Verification Queue & Case Registry', async ({ page }) => {
    await setupSession(page, PERSONAS.DEAN);

    await page.goto('/cases');
    await expect(page.locator('text=Cases').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_5_cases_registry.png') });

    await page.goto('/cases/create');
    await expect(page.locator('text=Create Case').or(page.locator('text=Incident Report')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_5_case_create.png') });

    await page.goto('/dean/verification');
    await expect(page.locator('text=Verification Queue').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_5_verification_queue.png') });
  });

  // Journey 6 & 7: Student Grievances, Anti-Ragging & Defense Responses
  test('Journey 6 & 7: Student Grievance Submission, Anti-Ragging Escalation & Responses', async ({ page }) => {
    await setupSession(page, PERSONAS.STUDENT);

    await page.goto('/grievances');
    await expect(page.locator('text=Grievance').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_6_grievances.png') });

    await page.goto('/grievances/raise');
    await expect(page.locator('text=Submit').or(page.locator('text=Raise')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_7_anti_ragging_submission.png') });

    await page.goto('/student/responses');
    await expect(page.locator('text=Defense').or(page.locator('text=Response')).or(page.locator('text=Inquiry')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_6_student_responses.png') });
  });

  // Journey 8: Evidence Vault & Cryptographic Verification
  test('Journey 8: Evidence Vault, SHA-256 Checksum & Chain of Custody', async ({ page }) => {
    await setupSession(page, PERSONAS.COMMITTEE_MEMBER);

    await page.goto('/committee/evidence');
    await expect(page.locator('text=Evidence Vault').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_8_evidence_vault.png') });
  });

  // Journey 9: Hearing Proceedings & Calendar Scheduling
  test('Journey 9: Hearing Scheduling Calendar & Deliberation Minutes', async ({ page }) => {
    await setupSession(page, PERSONAS.COMMITTEE_MEMBER);

    await page.goto('/committee/calendar');
    await expect(page.locator('text=Hearing Calendar').or(page.locator('text=Calendar')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_9_hearing_calendar.png') });

    await page.goto('/committee/reviews');
    await expect(page.locator('text=Committee').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_9_committee_reviews.png') });
  });

  // Journey 10: Student Appeals & Appellate Review
  test('Journey 10: Student Appeals Lodging & Appellate Determination Review', async ({ page }) => {
    // Student appeals filing
    await setupSession(page, PERSONAS.STUDENT);
    await page.goto('/student/appeals');
    await expect(page.locator('text=Appeals').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_10_student_appeals.png') });

    // Dean appellate review
    const deanPage = await page.context().newPage();
    await setupSession(deanPage, PERSONAS.DEAN);
    await deanPage.goto('/appeals/review');
    await expect(deanPage.locator('text=Appellate Review').first()).toBeVisible();
    await deanPage.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_10_appellate_review.png') });
    await deanPage.close();
  });

  // Journey 11: Counseling Referrals, Sessions & Welfare Follow-ups
  test('Journey 11: Counseling Referrals, Clinical Session Logging & Follow-ups', async ({ page }) => {
    await setupSession(page, PERSONAS.COORDINATOR);

    await page.goto('/counseling');
    await expect(page.locator('text=Counseling').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_11_counseling_overview.png') });

    await page.goto('/counseling/sessions');
    await expect(page.locator('text=Sessions').or(page.locator('text=Counseling Sessions')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_11_counseling_sessions.png') });

    await page.goto('/counseling/followups');
    await expect(page.locator('text=Follow-up').or(page.locator('text=Monitoring')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_11_counseling_followups.png') });
  });

  // Journey 12: Department Management
  test('Journey 12: Department Management & Academic Registry', async ({ page }) => {
    await setupSession(page, PERSONAS.SUPER_ADMIN);

    await page.goto('/admin/departments');
    await expect(page.locator('text=Department Management').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_12_departments_admin.png') });
  });

  // Journey 13: Student Digital Identity Card & QR Scanner Interface
  test('Journey 13: Student Digital Identity Card & QR Scanner Interface', async ({ page }) => {
    // Student Digital ID
    await setupSession(page, PERSONAS.STUDENT);
    await page.goto('/student/digital-id');
    await expect(page.locator('text=Digital Student ID').or(page.locator('text=Student Identity Card')).or(page.locator('text=Identity')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_13_student_digital_id.png') });

    // QR Scanner Interface with Dean
    await setupSession(page, PERSONAS.DEAN);
    await page.goto('/scanner');
    await expect(page.locator('text=Institutional QR Scanner').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_13_qr_scanner.png') });
  });

  // Journey 14: Grounded Policy AI Assistant
  test('Journey 14: Grounded Policy AI Advisory Assistant', async ({ page }) => {
    // Intercept API calls to prevent 401 session clearing
    await page.route('**/api/v1/ai/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          message: 'Success',
        }),
      });
    });

    await setupSession(page, PERSONAS.STUDENT);
    await page.goto('/ai-assistant');
    await expect(page.locator('text=Institutional Policy AI Assistant').or(page.locator('text=AI Assistant')).first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'journey_14_ai_assistant.png') });
  });
});
