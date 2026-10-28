// Vitest setup file for DOM environment
import React from 'react';
import { vi, beforeEach } from 'vitest';
import caseService from '../services/caseService';
import hearingService from '../services/hearingService';
import evidenceService from '../services/evidenceService';
import counselingService from '../services/counselingService';
import appealService from '../services/appealService';
import committeeService from '../services/committeeService';
import { INITIAL_MOCK_CASES } from '../mocks/mockCases';
import {
  INITIAL_HEARINGS,
  INITIAL_COMMITTEE_REVIEWS,
  INITIAL_EVIDENCE_VAULT,
  INITIAL_COUNSELING_REFERRALS,
} from '../mocks/mockCommitteeData';
import { INITIAL_MOCK_APPEALS } from '../mocks/mockAppeals';

globalThis.__CIVNEXA_TEST_FIXTURES__ = {
  cases: INITIAL_MOCK_CASES,
  hearings: INITIAL_HEARINGS,
  reviews: INITIAL_COMMITTEE_REVIEWS,
  evidence: INITIAL_EVIDENCE_VAULT,
  counseling: INITIAL_COUNSELING_REFERRALS,
  appeals: INITIAL_MOCK_APPEALS,
};

// Ensure test fixtures are available during automated test runs
beforeEach(() => {
  caseService.seedCasesForTesting(INITIAL_MOCK_CASES);
  hearingService.seedHearingsForTesting(INITIAL_HEARINGS);
  evidenceService.seedEvidenceForTesting(INITIAL_EVIDENCE_VAULT);
  counselingService.seedCounselingForTesting(INITIAL_COUNSELING_REFERRALS);
  appealService.seedAppealsForTesting(INITIAL_MOCK_APPEALS);
  committeeService.seedReviewsForTesting(INITIAL_COMMITTEE_REVIEWS);
});

// Mock react-chartjs-2 charts in JSDOM since JSDOM lacks a layout engine for canvas resizing
vi.mock('react-chartjs-2', () => ({
  Bar: (props) => React.createElement('div', { 'data-testid': 'mock-bar-chart' }, props.title || 'Bar Chart'),
  Doughnut: (props) => React.createElement('div', { 'data-testid': 'mock-doughnut-chart' }, props.title || 'Doughnut Chart'),
  Line: (props) => React.createElement('div', { 'data-testid': 'mock-line-chart' }, props.title || 'Line Chart'),
}));

// Mock window.matchMedia for prefers-reduced-motion
if (typeof window !== 'undefined') {
  if (!window.IntersectionObserver) {
    class MockIntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver;
    global.IntersectionObserver = MockIntersectionObserver;
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Default mock session for regression and protected route tests
  if (window.sessionStorage) {
    window.sessionStorage.setItem('civnexa_auth_session', 'active');
    window.sessionStorage.setItem(
      'civnexa_current_user',
      JSON.stringify({
        id: 'USR-002',
        name: 'Prof. Ananya Sen',
        email: 'ananya.sen@civnexa.edu',
        role: 'DEAN',
        roleLabel: 'Dean of Student Affairs',
        department: "Dean's Secretariat & Proctorial Board",
        title: 'Dean of Academic Conduct & Student Affairs',
        avatar: 'AS',
        notificationsCount: 7,
      })
    );
  }
}
