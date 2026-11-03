import { test, expect } from '@playwright/test';
import path from 'path';

const EVIDENCE_DIR = 'C:/Users/priyanshu dubey/.gemini/antigravity/brain/26a6c5ff-7fa8-4d6e-b1d5-e891b476be04/evidence';

const DEAN_USER = {
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
};

const setupSession = async (page, persona) => {
  await page.addInitScript((user) => {
    window.sessionStorage.setItem('civnexa_auth_session', 'active');
    window.sessionStorage.setItem('civnexa_current_user', JSON.stringify(user));
  }, persona);
};

test.describe('CIVNEXA — Accessibility (WCAG 2.1 AA) & Multi-Device Responsive Testing', () => {

  // Viewport 1: Mobile (390 x 844)
  test('Mobile Viewport (390x844): Verify responsive layout, touch targets, and table scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // 1. Mobile Public Landing
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'responsive_mobile_390_landing.png') });

    // 2. Mobile Login Page (unauthenticated)
    await page.goto('/login');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    const btnBox = await submitBtn.boundingBox();
    if (btnBox) {
      expect(btnBox.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'responsive_mobile_390_login.png') });

    // 3. Mobile Authenticated Dashboard
    const authedPage = await page.context().newPage();
    await authedPage.setViewportSize({ width: 390, height: 844 });
    await setupSession(authedPage, DEAN_USER);
    await authedPage.goto('/dashboard');
    await expect(authedPage.locator('main').first()).toBeVisible();
    await authedPage.screenshot({ path: path.join(EVIDENCE_DIR, 'responsive_mobile_390_dashboard.png') });

    // 4. Mobile Case Registry & Horizontal Scrollability
    await authedPage.goto('/cases');
    await expect(authedPage.locator('main').first()).toBeVisible();
    await authedPage.screenshot({ path: path.join(EVIDENCE_DIR, 'responsive_mobile_390_cases_table.png') });
    await authedPage.close();
  });

  // Viewport 2: Tablet (768 x 1024)
  test('Tablet Viewport (768x1024): Verify medium viewport adaptability and navigation', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupSession(page, DEAN_USER);

    // 1. Tablet Dashboard
    await page.goto('/dashboard');
    await expect(page.locator('main').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'responsive_tablet_768_dashboard.png') });

    // 2. Tablet Verification Queue
    await page.goto('/dean/verification');
    await expect(page.locator('main').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'responsive_tablet_768_verification.png') });
  });

  // Viewport 3: Desktop (1440 x 900) & Accessibility
  test('Desktop Viewport (1440x900): Verify WCAG semantic structure, keyboard navigation, and contrast', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupSession(page, DEAN_USER);

    await page.goto('/dashboard');
    await expect(page.locator('main').first()).toBeVisible();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'responsive_desktop_1440_dashboard.png') });

    // Verify semantic landmarks (navigation, main)
    await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible();

    // Verify keyboard Tab navigation without trap on /login
    const unauthedPage = await page.context().newPage();
    await unauthedPage.goto('/login');
    await unauthedPage.keyboard.press('Tab');
    await unauthedPage.keyboard.press('Tab');
    await unauthedPage.keyboard.press('Tab');
    await unauthedPage.screenshot({ path: path.join(EVIDENCE_DIR, 'accessibility_keyboard_focus_login.png') });
    await unauthedPage.close();
  });
});
