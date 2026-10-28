import { describe, it, expect, beforeEach } from 'vitest';
import { INITIAL_MOCK_CASES, CASE_CATEGORIES, CASE_STATUSES } from '../mocks/mockCases.js';
import { MOCK_USERS, ROLES } from '../mocks/mockUsers.js';
import caseService from '../services/caseService.js';

describe('Data Integrity and Mock Services (FE-1)', () => {
  beforeEach(() => {
    caseService.resetMockData();
  });

  it('validates mock cases and users datasets', () => {
    expect(INITIAL_MOCK_CASES.length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(ROLES).length).toBe(8);
    expect(MOCK_USERS.length).toBe(8);
    expect(CASE_CATEGORIES.length).toBeGreaterThanOrEqual(8);
    expect(CASE_STATUSES.length).toBeGreaterThanOrEqual(7);
  });

  it('calculates dynamic statistics directly from dataset records', async () => {
    const stats = await caseService.getCaseStats();
    expect(stats.total).toBe(INITIAL_MOCK_CASES.length);
    expect(stats.active).toBeGreaterThan(0);
    expect(stats.critical).toBeGreaterThan(0);
    expect(stats.resolved).toBeGreaterThan(0);
    expect(Object.keys(stats.categoryDistribution).length).toBeGreaterThanOrEqual(5);
    expect(Object.keys(stats.statusDistribution).length).toBeGreaterThanOrEqual(4);
  });

  it('filters cases by search query across multiple fields', async () => {
    const resultByName = await caseService.getCases({ search: 'Aarav' });
    expect(resultByName.items.length).toBe(1);
    expect(resultByName.items[0].student.name).toBe('Aarav Sharma');

    const resultByRoll = await caseService.getCases({ search: '22CSE041' });
    expect(resultByRoll.items.length).toBe(1);

    const resultByCaseRef = await caseService.getCases({ search: 'CX-2026-0102' });
    expect(resultByCaseRef.items.length).toBe(1);
  });

  it('filters cases strictly by category', async () => {
    const result = await caseService.getCases({ category: 'EXAM_INCIDENT' });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((c) => c.categoryKey === 'EXAM_INCIDENT')).toBe(true);
  });

  it('filters cases strictly by priority', async () => {
    const result = await caseService.getCases({ priority: 'CRITICAL' });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((c) => c.priority === 'CRITICAL')).toBe(true);
  });

  it('filters cases strictly by status', async () => {
    const result = await caseService.getCases({ status: 'RESOLVED' });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((c) => c.status === 'RESOLVED')).toBe(true);
  });

  it('paginates case listings correctly', async () => {
    const pageSize = 3;
    const page1 = await caseService.getCases({ page: 1, pageSize });
    expect(page1.items.length).toBe(pageSize);
    expect(page1.page).toBe(1);
    expect(page1.totalPages).toBe(Math.ceil(INITIAL_MOCK_CASES.length / pageSize));

    const page2 = await caseService.getCases({ page: 2, pageSize });
    expect(page2.items.length).toBe(pageSize);
    expect(page2.page).toBe(2);
    expect(page2.items[0].id).not.toBe(page1.items[0].id);
  });

  it('retrieves single case by ID or throws when not found', async () => {
    const single = await caseService.getCaseById('CX-2026-0101');
    expect(single).toBeDefined();
    expect(single.caseNumber).toBe('CX-2026-0101');

    await expect(caseService.getCaseById('INVALID-ID-9999')).rejects.toThrow();
  });

  it('updates case status interactively and persists state in memory', async () => {
    const targetCaseId = 'CX-2026-0101';
    const updated = await caseService.updateCaseStatus(targetCaseId, 'RESOLVED', 'Resolved');
    expect(updated.status).toBe('RESOLVED');
    expect(updated.statusLabel).toBe('Resolved');

    const fetched = await caseService.getCaseById(targetCaseId);
    expect(fetched.status).toBe('RESOLVED');

    const statsAfter = await caseService.getCaseStats();
    expect(statsAfter.resolved).toBeGreaterThan(0);
  });
});
