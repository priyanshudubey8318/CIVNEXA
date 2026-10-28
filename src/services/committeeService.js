// Disciplinary Committee Workspace & Deliberation Service for CIVNEXA Phase FE-4
// Manages committee reviews, deliberation drafts, recommendations, and status workflows.

import caseService from './caseService';
import hearingService from './hearingService';
import evidenceService from './evidenceService';

const STORAGE_KEY = 'civnexa_committee_reviews_store';

const loadReviews = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse committee reviews from storage', e);
    return [];
  }
};

const saveReviews = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save committee reviews to storage', e);
  }
};

let currentReviews = loadReviews();

export const committeeService = {
  resetMockData: (fixtures = null) => {
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    const testReviews = isTest && typeof globalThis !== 'undefined' ? globalThis.__CIVNEXA_TEST_FIXTURES__?.reviews : null;
    currentReviews = fixtures || (testReviews ? JSON.parse(JSON.stringify(testReviews)) : []);
    saveReviews(currentReviews);
    return currentReviews;
  },

  clearAllReviews: () => {
    currentReviews = [];
    saveReviews([]);
    return [];
  },

  seedReviewsForTesting: (fixtures = []) => {
    currentReviews = JSON.parse(JSON.stringify(fixtures || []));
    saveReviews(currentReviews);
    return currentReviews;
  },

  /**
   * Calculates comprehensive dynamic metrics for the Disciplinary Committee Dashboard
   */
  getCommitteeMetrics: async (currentUser = null) => {
    const reviews = loadReviews();
    const hearings = await hearingService.getHearings({ currentUser });
    const evidence = await evidenceService.getEvidence({ currentUser });

    const awaitingReview = reviews.filter((r) => r.status === 'AWAITING_REVIEW').length;
    const underReview = reviews.filter((r) => r.status === 'UNDER_REVIEW').length;
    const upcomingHearings = hearings.filter((h) => h.status === 'SCHEDULED' || h.status === 'RESCHEDULED').length;
    const awaitingMinutes = hearings.filter((h) => h.status === 'AWAITING_MINUTES' || (h.minutes && h.minutes.draft)).length;
    const pendingRecommendations = reviews.filter((r) => r.status === 'UNDER_REVIEW' || r.status === 'RECOMMENDATION_DRAFTED').length;
    const flaggedEvidence = evidence.filter((e) => e.reviewStatus === 'FLAGGED').length;
    const completedReviews = reviews.filter((r) => r.status === 'RECOMMENDATION_SUBMITTED' || r.status === 'COMPLETED').length;

    return {
      awaitingReview,
      underReview,
      upcomingHearings,
      awaitingMinutes,
      pendingRecommendations,
      flaggedEvidence,
      completedReviews,
      totalReviews: reviews.length,
    };
  },

  /**
   * Retrieves committee reviews matching filters
   */
  getReviews: async ({ status = 'ALL', searchQuery = '', currentUser = null } = {}) => {
    await new Promise((r) => setTimeout(r, 40));
    let items = loadReviews();

    if (status && status !== 'ALL') {
      items = items.filter((r) => r.status === status);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.caseNumber.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.assignedTo && r.assignedTo.toLowerCase().includes(q))
      );
    }

    return items;
  },

  getReviewQueue: async (params) => {
    return committeeService.getReviews(params);
  },

  getReviewById: async (id) => {
    await new Promise((r) => setTimeout(r, 20));
    const items = loadReviews();
    const found = items.find((r) => r.id === id || r.caseId === id || r.caseNumber === id);
    if (!found) {
      throw new Error(`Review with ID ${id} not found.`);
    }
    return JSON.parse(JSON.stringify(found));
  },

  /**
   * Starts or updates active review status
   */
  startReview: async (reviewId, reviewer) => {
    await new Promise((r) => setTimeout(r, 50));
    const items = loadReviews();
    const index = items.findIndex((r) => r.id === reviewId || r.caseId === reviewId);
    if (index === -1) throw new Error(`Review ${reviewId} not found.`);

    const nowIso = new Date().toISOString();
    const reviewerName = reviewer?.name || 'Dr. Alok Nath';

    items[index].status = 'UNDER_REVIEW';
    items[index].assignedTo = reviewerName;
    items[index].updatedAt = nowIso;

    saveReviews(items);
    currentReviews = items;

    // Log in case activities
    try {
      await caseService.addInvestigationNote(items[index].caseId, {
        noteText: `Formal Disciplinary Committee review initiated by ${reviewerName}.`,
        author: reviewer,
      });
    } catch (e) {
      console.warn('Sync with case activities:', e);
    }

    return items[index];
  },

  /**
   * Adds an individual deliberation note to a review docket
   */
  addReviewNote: async (reviewId, { noteText, author }) => {
    await new Promise((r) => setTimeout(r, 40));
    const items = loadReviews();
    const index = items.findIndex((r) => r.id === reviewId || r.caseId === reviewId);
    if (index === -1) throw new Error(`Review ${reviewId} not found.`);

    if (!noteText || noteText.trim() === '') {
      throw new Error('Review note text is required.');
    }

    const nowIso = new Date().toISOString();
    const authorName = author?.name || 'Committee Member';
    const authorRole = author?.role || 'COMMITTEE_MEMBER';

    const newNote = {
      id: `RN-${Date.now()}`,
      author: authorName,
      role: authorRole,
      date: nowIso,
      text: noteText.trim(),
    };

    items[index].notes = [...(items[index].notes || []), newNote];
    items[index].updatedAt = nowIso;

    saveReviews(items);
    currentReviews = items;

    // Sync to case notes
    try {
      await caseService.addInvestigationNote(items[index].caseId, {
        noteText: `Committee Deliberation Note (${authorName}): "${noteText.trim().substring(0, 80)}..."`,
        author,
      });
    } catch (e) {
      console.warn('Sync with case notes:', e);
    }

    return newNote;
  },

  /**
   * Saves a draft committee recommendation
   */
  saveRecommendationDraft: async (
    reviewId,
    { category, rationale, proposedSanction, followUp, participatingMembers = [], documentsConsidered = [] }
  ) => {
    await new Promise((r) => setTimeout(r, 50));
    const items = loadReviews();
    const index = items.findIndex((r) => r.id === reviewId || r.caseId === reviewId);
    if (index === -1) throw new Error(`Review ${reviewId} not found.`);

    const nowIso = new Date().toISOString();

    items[index].recommendationDraft = {
      category,
      rationale: rationale.trim(),
      proposedSanction: proposedSanction?.trim() || '',
      followUp: followUp?.trim() || '',
      isDraft: true,
      updatedAt: nowIso,
    };
    items[index].participatingMembers =
      participatingMembers.length > 0 ? participatingMembers : items[index].participatingMembers;
    items[index].documentsConsidered =
      documentsConsidered.length > 0 ? documentsConsidered : items[index].documentsConsidered;
    items[index].status = 'RECOMMENDATION_DRAFTED';
    items[index].updatedAt = nowIso;

    saveReviews(items);
    currentReviews = items;
    return items[index].recommendationDraft;
  },

  /**
   * Submits a formal committee recommendation to the Dean / Executive Board
   */
  submitRecommendation: async (
    reviewId,
    {
      category,
      rationale,
      proposedSanction,
      followUp,
      participatingMembers = [],
      documentsConsidered = [],
      submittedBy,
    }
  ) => {
    await new Promise((r) => setTimeout(r, 60));
    const items = loadReviews();
    const index = items.findIndex((r) => r.id === reviewId || r.caseId === reviewId);
    if (index === -1) throw new Error(`Review ${reviewId} not found.`);

    if (!category) {
      throw new Error('Recommendation category is required.');
    }
    if (!rationale || rationale.trim().length < 15) {
      throw new Error('Supporting rationale must be at least 15 characters.');
    }

    const nowIso = new Date().toISOString();
    const submitterName = submittedBy?.name || 'Dr. Alok Nath (Ethics Committee Lead)';

    const formalRecommendation = {
      category,
      rationale: rationale.trim(),
      proposedSanction: proposedSanction?.trim() || 'Referral for authorized administrative guidance',
      followUp: followUp?.trim() || 'Compliance review within 30 days',
      submittedBy: submitterName,
      submittedAt: nowIso,
      status: 'PENDING_DEAN_APPROVAL',
    };

    items[index].submittedRecommendation = formalRecommendation;
    items[index].recommendationDraft = null;
    items[index].status = 'RECOMMENDATION_SUBMITTED';
    items[index].participatingMembers =
      participatingMembers.length > 0 ? participatingMembers : items[index].participatingMembers;
    items[index].documentsConsidered =
      documentsConsidered.length > 0 ? documentsConsidered : items[index].documentsConsidered;
    items[index].updatedAt = nowIso;

    saveReviews(items);
    currentReviews = items;

    // Update case status to DECISION_PENDING in caseService
    try {
      await caseService.updateCaseStatus(
        items[index].caseId,
        'DECISION_PENDING',
        `Committee Recommendation formally submitted: "${category}". Sanction proposal: ${proposedSanction || 'See docket'}.`,
        submittedBy
      );
    } catch (e) {
      console.warn('Sync with caseService:', e);
    }

    return formalRecommendation;
  },

  /**
   * Request additional inquiry information from investigator or student
   */
  requestAdditionalInfo: async (reviewId, { details, requestedFrom, requestedBy }) => {
    await new Promise((r) => setTimeout(r, 40));
    const items = loadReviews();
    const index = items.findIndex((r) => r.id === reviewId || r.caseId === reviewId);
    if (index === -1) throw new Error(`Review ${reviewId} not found.`);

    const nowIso = new Date().toISOString();
    const actorName = requestedBy?.name || 'Disciplinary Board';

    const note = {
      id: `RN-REQ-${Date.now()}`,
      author: actorName,
      role: requestedBy?.role || 'COMMITTEE_MEMBER',
      date: nowIso,
      text: `Additional information requested from ${requestedFrom || 'investigator'}: "${details}"`,
    };

    items[index].notes = [...(items[index].notes || []), note];
    items[index].updatedAt = nowIso;

    saveReviews(items);
    currentReviews = items;

    try {
      await caseService.addInvestigationNote(items[index].caseId, {
        noteText: note.text,
        author: requestedBy,
      });
    } catch (e) {
      console.warn('Sync note to caseService:', e);
    }

    return note;
  },
};

export default committeeService;
