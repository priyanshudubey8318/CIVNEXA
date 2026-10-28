// Centralized Appeal & Dispute Reconsideration Service for CIVNEXA (Phase FE-6)
// Handles student appeal submissions, reviewer assignment, additional information requests,
// recommendations, authorized final outcomes, and chronological timeline preservation.

import { APPEAL_GROUNDS, APPEAL_STATUSES } from '../constants/appealConfig';
import caseService from './caseService';

const STORAGE_KEY = 'civnexa_appeals_store';

class AppealService {
  constructor() {
    this._initStorage();
  }

  _initStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Do not seed demo records in normal application usage
      }
    } catch (e) {
      console.warn('LocalStorage unavailable in AppealService initialization', e);
    }
  }

  _getAllAppeals() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read appeals store', e);
    }
    return [];
  }

  _saveAppeals(appeals) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appeals));
    } catch (e) {
      console.error('Failed to write appeals store', e);
    }
  }

  resetMockData(fixtures = null) {
    try {
      const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      const testAppeals = isTest && typeof globalThis !== 'undefined' ? globalThis.__CIVNEXA_TEST_FIXTURES__?.appeals : null;
      const items = fixtures || (testAppeals ? JSON.parse(JSON.stringify(testAppeals)) : []);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return items;
    } catch (e) {
      console.error('Failed to reset appeals store', e);
      return [];
    }
  }

  clearAllAppeals() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    } catch (e) {
      return [];
    }
  }

  seedAppealsForTesting(fixtures = []) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fixtures || []));
      return fixtures;
    } catch (e) {
      return [];
    }
  }

  getGrounds() {
    return [...APPEAL_GROUNDS];
  }

  getStatuses() {
    return [...APPEAL_STATUSES];
  }

  /**
   * Retrieves appeals filtered by role, student identity, search, or status
   */
  async getAppeals({
    currentUser = null,
    status = 'ALL',
    search = '',
    department = 'ALL',
    reviewerId = null,
  } = {}) {
    let items = this._getAllAppeals();

    // Role-based visibility scoping
    if (currentUser && currentUser.role === 'STUDENT') {
      items = items.filter(
        (a) =>
          a.appellant?.id === currentUser.id ||
          a.appellant?.rollNo?.toLowerCase() === (currentUser.rollNo || '22CSE041').toLowerCase() ||
          a.appellant?.email?.toLowerCase() === currentUser.email?.toLowerCase()
      );
    } else if (currentUser && (currentUser.role === 'FACULTY' || currentUser.role === 'STAFF')) {
      // General staff/faculty can only view if explicitly assigned or in department
      items = items.filter(
        (a) =>
          a.assignedReviewer?.id === currentUser.id ||
          a.appellant?.departmentCode === currentUser.departmentCode
      );
    }

    // Status filter
    if (status && status !== 'ALL') {
      items = items.filter((a) => a.status === status);
    }

    // Department filter
    if (department && department !== 'ALL') {
      items = items.filter(
        (a) =>
          a.appellant?.department === department ||
          a.appellant?.departmentCode === department
      );
    }

    // Reviewer filter
    if (reviewerId) {
      items = items.filter((a) => a.assignedReviewer?.id === reviewerId);
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (a) =>
          a.appealNumber?.toLowerCase().includes(q) ||
          a.caseNumber?.toLowerCase().includes(q) ||
          a.caseTitle?.toLowerCase().includes(q) ||
          a.appellant?.name?.toLowerCase().includes(q) ||
          a.appellant?.rollNo?.toLowerCase().includes(q) ||
          a.groundsSummary?.toLowerCase().includes(q) ||
          a.explanation?.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    return items;
  }

  async getAppealById(appealId) {
    const items = this._getAllAppeals();
    return items.find((a) => a.id === appealId || a.appealNumber === appealId) || null;
  }

  async getAppealsForCase(caseId) {
    const items = this._getAllAppeals();
    return items.filter((a) => a.caseId === caseId || a.caseNumber === caseId);
  }

  /**
   * Identifies cases eligible for student appeal
   */
  async getEligibleCasesForAppeal(studentId, currentUser = null) {
    try {
      const casesRes = await caseService.getCases({
        pageSize: 50,
        currentUser: currentUser || { id: studentId, role: 'STUDENT' },
        role: 'STUDENT',
      });

      const allCases = casesRes.items || [];
      // Eligible cases are those involving this student
      return allCases.filter(
        (c) =>
          !c.caseNumber.startsWith('GRV') &&
          c.categoryKey !== 'ACADEMIC_GRIEVANCE' &&
          c.categoryKey !== 'CAMPUS_SAFETY'
      );
    } catch (err) {
      console.error('Failed to get eligible cases for appeal', err);
      return [];
    }
  }

  /**
   * Submits a structured multi-section appeal
   * Preserves the original decision and records immutable audit events
   */
  async submitAppeal({
    caseId,
    caseNumber,
    caseTitle,
    originalDecision,
    grounds,
    explanation,
    reliefSought,
    supportingDocuments = [],
    appellant,
    currentUser,
  }) {
    if (!caseId || !caseNumber) {
      throw new Error('Case reference is required to lodge an appeal.');
    }
    if (!grounds || grounds.length === 0) {
      throw new Error('At least one statutory ground for appeal must be selected.');
    }
    if (!explanation || explanation.trim().length < 20) {
      throw new Error('Detailed explanation of at least 20 characters is required.');
    }

    const items = this._getAllAppeals();
    const count = items.length + 1;
    const appealNumber = `APL-2026-${String(count).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const groundsObjs = APPEAL_GROUNDS.filter((g) => grounds.includes(g.key));
    const groundsSummary = groundsObjs.map((g) => g.label).join(', ');

    const newAppeal = {
      id: appealNumber,
      appealNumber,
      caseId,
      caseNumber,
      caseTitle: caseTitle || `Disciplinary Matter (${caseNumber})`,
      appellant: appellant || {
        id: currentUser?.id || 'STU-8821',
        name: currentUser?.name || 'Aarav Sharma',
        rollNo: currentUser?.rollNo || '22CSE041',
        email: currentUser?.email || 'aarav.sharma@civnexa.edu',
        department: currentUser?.department || 'Computer Science & Engineering',
        departmentCode: currentUser?.departmentCode || 'CSE',
      },
      originalDecision: {
        decisionDate: originalDecision?.decisionDate || timestamp,
        decisionSummary: originalDecision?.decisionSummary || 'Original disciplinary decision and proctorial finding on record.',
        sanctionType: originalDecision?.sanctionType || 'PROCTORIAL_SANCTION',
        decidedBy: originalDecision?.decidedBy || 'Disciplinary Board',
        decisionPreserved: true, // Original decision is strictly preserved
      },
      appealDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      submittedAt: timestamp,
      updatedAt: timestamp,
      status: 'SUBMITTED',
      statusLabel: 'Submitted',
      grounds,
      groundsSummary,
      explanation: explanation.trim(),
      reliefSought: reliefSought?.trim() || 'Fair reconsideration of the disciplinary sanction.',
      supportingDocuments: supportingDocuments || [],
      declarationConfirmed: true,
      assignedReviewer: null,
      reviewerNotes: [],
      additionalInfoRequests: [],
      recommendation: null,
      finalOutcome: null,
      timeline: [
        {
          id: `AP-TL-${Date.now()}-1`,
          event: 'APPEAL_SUBMITTED',
          title: 'Appellate Petition Lodged',
          actor: `${currentUser?.name || appellant?.name || 'Student'} (Appellant)`,
          role: 'STUDENT',
          timestamp,
          previousStatus: 'DRAFT',
          newStatus: 'SUBMITTED',
          explanation: `Formal appeal petition registered on grounds: ${groundsSummary}. Original case determination remains preserved.`,
        },
      ],
    };

    items.unshift(newAppeal);
    this._saveAppeals(items);

    // Register activity note on original case without altering its original decision
    try {
      await caseService.addInvestigationNote(caseId, {
        author: 'System Registrar',
        noteText: `Notice: Formal Student Appeal ${appealNumber} registered against this case determination on grounds: ${groundsSummary}. Original decision preserved pending appellate review.`,
      });
    } catch (e) {
      console.warn('Could not post notice to parent case', e);
    }

    return newAppeal;
  }

  /**
   * Assigns an independent reviewer (warns if assigning original decision maker)
   */
  async assignReviewer(appealId, reviewerUser, actor) {
    const items = this._getAllAppeals();
    const idx = items.findIndex((a) => a.id === appealId);
    if (idx === -1) throw new Error('Appeal not found.');

    const appeal = items[idx];
    const timestamp = new Date().toISOString();

    // Check potential conflict of interest
    const isConflict =
      appeal.originalDecision?.decidedBy &&
      reviewerUser?.name &&
      appeal.originalDecision.decidedBy.toLowerCase().includes(reviewerUser.name.toLowerCase());

    appeal.assignedReviewer = {
      id: reviewerUser.id,
      name: reviewerUser.name,
      role: reviewerUser.role,
      title: reviewerUser.title || reviewerUser.department,
      assignedAt: timestamp,
      hasConflictNotice: isConflict,
    };

    const previousStatus = appeal.status;
    appeal.status = 'UNDER_REVIEW';
    appeal.statusLabel = 'Under Review';
    appeal.updatedAt = timestamp;

    appeal.timeline.push({
      id: `AP-TL-${Date.now()}`,
      event: 'REVIEWER_ASSIGNED',
      title: 'Reviewer Assigned',
      actor: `${actor?.name || 'Registrar'} (${actor?.role || 'ADMIN'})`,
      role: actor?.role || 'ADMIN',
      timestamp,
      previousStatus,
      newStatus: 'UNDER_REVIEW',
      explanation: isConflict
        ? `Reviewer ${reviewerUser.name} assigned. Cautionary Note: Prior involvement in original matter noted in audit record.`
        : `Assigned to ${reviewerUser.name} (${reviewerUser.role}) for independent appellate assessment.`,
    });

    this._saveAppeals(items);
    return appeal;
  }

  /**
   * Requests additional information or documents from appellant
   */
  async requestAdditionalInfo(appealId, { query, deadline }, actor) {
    if (!query || !query.trim()) throw new Error('Information request query is required.');

    const items = this._getAllAppeals();
    const idx = items.findIndex((a) => a.id === appealId);
    if (idx === -1) throw new Error('Appeal not found.');

    const appeal = items[idx];
    const timestamp = new Date().toISOString();

    const requestItem = {
      id: `REQ-${Date.now()}`,
      query: query.trim(),
      requestedBy: actor?.name || 'Appellate Reviewer',
      requestedAt: timestamp,
      deadline: deadline || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING_STUDENT_SUBMISSION',
    };

    appeal.additionalInfoRequests = appeal.additionalInfoRequests || [];
    appeal.additionalInfoRequests.push(requestItem);

    const previousStatus = appeal.status;
    appeal.status = 'ADDITIONAL_INFORMATION_REQUESTED';
    appeal.statusLabel = 'Info Requested';
    appeal.updatedAt = timestamp;

    appeal.timeline.push({
      id: `AP-TL-${Date.now()}`,
      event: 'ADDITIONAL_INFO_REQUESTED',
      title: 'Supplementary Information Requested',
      actor: `${actor?.name || 'Reviewer'} (${actor?.role || 'DEAN'})`,
      role: actor?.role || 'DEAN',
      timestamp,
      previousStatus,
      newStatus: 'ADDITIONAL_INFORMATION_REQUESTED',
      explanation: `Specific clarification requested: "${query.trim()}". Deadline for response set.`,
    });

    this._saveAppeals(items);
    return appeal;
  }

  /**
   * Student submits response to an additional information request
   */
  async submitAdditionalInfo(appealId, requestId, { responseText, documents = [] }, actor) {
    const items = this._getAllAppeals();
    const idx = items.findIndex((a) => a.id === appealId);
    if (idx === -1) throw new Error('Appeal not found.');

    const appeal = items[idx];
    const timestamp = new Date().toISOString();

    const req = (appeal.additionalInfoRequests || []).find((r) => r.id === requestId);
    if (req) {
      req.status = 'SUBMITTED';
      req.responseText = responseText;
      req.submittedAt = timestamp;
      req.attachedDocuments = documents;
    }

    const previousStatus = appeal.status;
    appeal.status = 'UNDER_REVIEW';
    appeal.statusLabel = 'Under Review';
    appeal.updatedAt = timestamp;

    appeal.timeline.push({
      id: `AP-TL-${Date.now()}`,
      event: 'ADDITIONAL_INFO_SUBMITTED',
      title: 'Clarification Submitted by Appellant',
      actor: `${actor?.name || 'Appellant'} (Student)`,
      role: 'STUDENT',
      timestamp,
      previousStatus,
      newStatus: 'UNDER_REVIEW',
      explanation: `Appellant furnished requested supplementary clarification and documentation. Review resumed.`,
    });

    this._saveAppeals(items);
    return appeal;
  }

  /**
   * Adds internal reviewer deliberation notes
   */
  async recordReviewNotes(appealId, text, actor) {
    if (!text || !text.trim()) throw new Error('Review note cannot be blank.');

    const items = this._getAllAppeals();
    const idx = items.findIndex((a) => a.id === appealId);
    if (idx === -1) throw new Error('Appeal not found.');

    const appeal = items[idx];
    const timestamp = new Date().toISOString();

    appeal.reviewerNotes = appeal.reviewerNotes || [];
    appeal.reviewerNotes.push({
      id: `APN-${Date.now()}`,
      author: actor?.name || 'Appellate Reviewer',
      role: actor?.role || 'DEAN',
      timestamp,
      text: text.trim(),
    });

    appeal.updatedAt = timestamp;
    this._saveAppeals(items);
    return appeal;
  }

  /**
   * Submits formal review recommendation (distinct from final decision)
   */
  async submitRecommendation(appealId, { recommendationText, proposedOutcome, justification }, actor) {
    if (!proposedOutcome) throw new Error('Proposed outcome recommendation is required.');

    const items = this._getAllAppeals();
    const idx = items.findIndex((a) => a.id === appealId);
    if (idx === -1) throw new Error('Appeal not found.');

    const appeal = items[idx];
    const timestamp = new Date().toISOString();

    appeal.recommendation = {
      recommendationText: recommendationText || '',
      proposedOutcome, // UPHELD, MODIFIED, REMANDED_FOR_REVIEW
      justification: justification || '',
      submittedBy: actor?.name || 'Reviewer',
      submittedRole: actor?.role || 'DEAN',
      submittedAt: timestamp,
    };

    const previousStatus = appeal.status;
    appeal.status = 'REVIEW_COMPLETED';
    appeal.statusLabel = 'Review Completed';
    appeal.updatedAt = timestamp;

    appeal.timeline.push({
      id: `AP-TL-${Date.now()}`,
      event: 'RECOMMENDATION_RECORDED',
      title: 'Appellate Review Recommendation Recorded',
      actor: `${actor?.name || 'Reviewer'} (${actor?.role || 'DEAN'})`,
      role: actor?.role || 'DEAN',
      timestamp,
      previousStatus,
      newStatus: 'REVIEW_COMPLETED',
      explanation: `Appellate recommendation submitted: Propose to ${proposedOutcome.replace(/_/g, ' ')}. Pending final executive authorization.`,
    });

    this._saveAppeals(items);
    return appeal;
  }

  /**
   * Records authorized final outcome (human in the loop action)
   */
  async recordFinalOutcome(appealId, { outcome, justification, authorizedBy, remandInstructions }, actor) {
    const validOutcomes = ['UPHELD', 'MODIFIED', 'REMANDED_FOR_REVIEW', 'WITHDRAWN'];
    if (!validOutcomes.includes(outcome)) {
      throw new Error(`Invalid outcome: ${outcome}. Must be one of ${validOutcomes.join(', ')}.`);
    }

    const items = this._getAllAppeals();
    const idx = items.findIndex((a) => a.id === appealId);
    if (idx === -1) throw new Error('Appeal not found.');

    const appeal = items[idx];
    const timestamp = new Date().toISOString();

    appeal.finalOutcome = {
      outcome,
      justification: justification || 'Authorized executive determination following appellate review.',
      authorizedBy: authorizedBy || actor?.name || 'Executive Authority',
      authorizedRole: actor?.role || 'SUPER_ADMIN',
      authorizedAt: timestamp,
      remandInstructions: outcome === 'REMANDED_FOR_REVIEW' ? remandInstructions || '' : null,
    };

    const previousStatus = appeal.status;
    appeal.status = outcome;
    appeal.statusLabel = outcome === 'UPHELD' ? 'Original Decision Upheld' :
                         outcome === 'MODIFIED' ? 'Sanction Modified' :
                         outcome === 'REMANDED_FOR_REVIEW' ? 'Remanded for Re-Hearing' : 'Withdrawn';
    appeal.updatedAt = timestamp;

    appeal.timeline.push({
      id: `AP-TL-${Date.now()}`,
      event: 'OUTCOME_AUTHORIZED',
      title: `Final Appellate Determination: ${appeal.statusLabel}`,
      actor: `${actor?.name || authorizedBy || 'Authority'} (${actor?.role || 'EXECUTIVE'})`,
      role: actor?.role || 'SUPER_ADMIN',
      timestamp,
      previousStatus,
      newStatus: outcome,
      explanation: justification || `Final decision authorized. Outcome: ${appeal.statusLabel}.`,
    });

    this._saveAppeals(items);

    // Notify parent case activity
    try {
      await caseService.addInvestigationNote(appeal.caseId, {
        author: 'Appellate Authority',
        noteText: `Appellate Determination Recorded for ${appeal.appealNumber}: ${appeal.statusLabel}. ${justification || ''}`,
      });
    } catch (e) {
      console.warn('Could not post determination to parent case', e);
    }

    return appeal;
  }

  /**
   * Allows student or authorized party to withdraw an appeal
   */
  async withdrawAppeal(appealId, reason, actor) {
    const items = this._getAllAppeals();
    const idx = items.findIndex((a) => a.id === appealId);
    if (idx === -1) throw new Error('Appeal not found.');

    const appeal = items[idx];
    const timestamp = new Date().toISOString();

    const previousStatus = appeal.status;
    appeal.status = 'WITHDRAWN';
    appeal.statusLabel = 'Withdrawn';
    appeal.updatedAt = timestamp;

    appeal.timeline.push({
      id: `AP-TL-${Date.now()}`,
      event: 'APPEAL_WITHDRAWN',
      title: 'Appeal Formally Withdrawn',
      actor: `${actor?.name || 'Appellant'} (${actor?.role || 'STUDENT'})`,
      role: actor?.role || 'STUDENT',
      timestamp,
      previousStatus,
      newStatus: 'WITHDRAWN',
      explanation: reason || 'Appeal petition withdrawn upon student request.',
    });

    this._saveAppeals(items);
    return appeal;
  }

  /**
   * Computes aggregated appeal metrics
   */
  async getAppealMetrics() {
    const items = this._getAllAppeals();
    return {
      totalAppeals: items.length,
      submitted: items.filter((a) => a.status === 'SUBMITTED').length,
      underReview: items.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'ADDITIONAL_INFORMATION_REQUESTED').length,
      reviewCompleted: items.filter((a) => a.status === 'REVIEW_COMPLETED').length,
      upheld: items.filter((a) => a.status === 'UPHELD').length,
      modified: items.filter((a) => a.status === 'MODIFIED').length,
      remanded: items.filter((a) => a.status === 'REMANDED_FOR_REVIEW').length,
      withdrawn: items.filter((a) => a.status === 'WITHDRAWN').length,
    };
  }
}

export const appealService = new AppealService();
export default appealService;
