/**
 * Storage Migration Utility for CIVNEXA
 * 
 * Safely removes known application-generated demo fixtures from localStorage/sessionStorage
 * on application initialization, without wiping unrelated user-created data.
 * 
 * Preserves user-created cases, real workflows, and application configuration.
 */

const KNOWN_DEMO_CASE_NUMBERS = new Set([
  'CX-2026-0101',
  'CX-2026-0102',
  'CX-2026-0103',
  'CX-2026-0104',
  'CX-2026-0105',
  'CX-2026-0106',
  'CX-2026-0107',
  'CX-2026-0108',
]);

const KNOWN_DEMO_HEARING_IDS = new Set([
  'H-2026-001',
  'H-2026-002',
  'H-2026-003',
]);

const KNOWN_DEMO_REVIEW_IDS = new Set([
  'CR-2026-001',
  'CR-2026-002',
  'CR-2026-003',
  'CR-2026-004',
]);

const KNOWN_DEMO_EVIDENCE_IDS = new Set([
  'EVD-2026-001',
  'EVD-2026-002',
  'EVD-2026-003',
  'EVD-2026-004',
  'EVD-2026-005',
]);

const KNOWN_DEMO_COUNSELING_IDS = new Set([
  'REF-2026-001',
  'REF-2026-002',
  'REF-2026-003',
  'REF-2026-004',
]);

const KNOWN_DEMO_APPEAL_IDS = new Set([
  'APP-2026-001',
  'APP-2026-002',
  'APP-2026-003',
  'APP-2026-004',
  'APP-2026-005',
]);

const KNOWN_DEMO_AUDIT_IDS = new Set([
  'AUD-001',
  'AUD-002',
  'AUD-003',
]);

const MIGRATION_VERSION_KEY = 'civnexa_storage_version_v3';

export const runStorageMigration = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const currentVersion = window.localStorage.getItem(MIGRATION_VERSION_KEY);
    if (currentVersion === '3.0.0') {
      return; // Migration already completed
    }

    // 1. Clean cases store
    const casesRaw = window.localStorage.getItem('civnexa_cases_store');
    if (casesRaw) {
      try {
        const parsed = JSON.parse(casesRaw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (c) => !KNOWN_DEMO_CASE_NUMBERS.has(c.caseNumber) && !KNOWN_DEMO_CASE_NUMBERS.has(c.id) && !c.isDemoFixture
          );
          window.localStorage.setItem('civnexa_cases_store', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Migration: Failed to parse cases store', e);
      }
    }

    // 2. Clean hearings store
    const hearingsRaw = window.localStorage.getItem('civnexa_hearings_store');
    if (hearingsRaw) {
      try {
        const parsed = JSON.parse(hearingsRaw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (h) => !KNOWN_DEMO_HEARING_IDS.has(h.id) && !h.isDemoFixture
          );
          window.localStorage.setItem('civnexa_hearings_store', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Migration: Failed to parse hearings store', e);
      }
    }

    // 3. Clean evidence store
    const evidenceRaw = window.localStorage.getItem('civnexa_evidence_vault');
    if (evidenceRaw) {
      try {
        const parsed = JSON.parse(evidenceRaw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (ev) => !KNOWN_DEMO_EVIDENCE_IDS.has(ev.id) && !ev.isDemoFixture
          );
          window.localStorage.setItem('civnexa_evidence_vault', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Migration: Failed to parse evidence store', e);
      }
    }

    // 4. Clean counseling store
    const counselingRaw = window.localStorage.getItem('civnexa_counseling_referrals_store');
    if (counselingRaw) {
      try {
        const parsed = JSON.parse(counselingRaw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (c) => !KNOWN_DEMO_COUNSELING_IDS.has(c.id) && !c.isDemoFixture
          );
          window.localStorage.setItem('civnexa_counseling_referrals_store', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Migration: Failed to parse counseling store', e);
      }
    }

    // 5. Clean appeals store
    const appealsRaw = window.localStorage.getItem('civnexa_appeals_store');
    if (appealsRaw) {
      try {
        const parsed = JSON.parse(appealsRaw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (a) => !KNOWN_DEMO_APPEAL_IDS.has(a.id) && !a.isDemoFixture
          );
          window.localStorage.setItem('civnexa_appeals_store', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Migration: Failed to parse appeals store', e);
      }
    }

    // 6. Clean committee reviews store
    const reviewsRaw = window.localStorage.getItem('civnexa_committee_reviews_store');
    if (reviewsRaw) {
      try {
        const parsed = JSON.parse(reviewsRaw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (r) => !KNOWN_DEMO_REVIEW_IDS.has(r.id) && !r.isDemoFixture
          );
          window.localStorage.setItem('civnexa_committee_reviews_store', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Migration: Failed to parse committee reviews store', e);
      }
    }

    // 7. Clean audit logs store
    const auditRaw = window.localStorage.getItem('civnexa_admin_audit');
    if (auditRaw) {
      try {
        const parsed = JSON.parse(auditRaw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (log) => !KNOWN_DEMO_AUDIT_IDS.has(log.id) && !log.isDemoFixture
          );
          window.localStorage.setItem('civnexa_admin_audit', JSON.stringify(filtered));
        }
      } catch (e) {
        console.warn('Migration: Failed to parse audit store', e);
      }
    }

    // Mark migration completed
    window.localStorage.setItem(MIGRATION_VERSION_KEY, '3.0.0');
  } catch (err) {
    console.warn('Civnexa storage migration encountered an error:', err);
  }
};

// Run automatically on module load
if (typeof window !== 'undefined') {
  runStorageMigration();
}

export default runStorageMigration;
