// Student Counseling & Mentorship Service for CIVNEXA Phase FE-4
// Manages counseling referrals, sessions, attendance recording, and welfare follow-ups.

import caseService from './caseService';
import { apiClient, getAuthToken } from './apiClient.js';

const STORAGE_KEY = 'civnexa_counseling_referrals_store';

const loadReferrals = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse counseling referrals from storage', e);
    return [];
  }
};

const saveReferrals = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save counseling referrals to storage', e);
  }
};

let currentReferrals = loadReferrals();

export const counselingService = {
  resetMockData: (fixtures = null) => {
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    const testCounseling = isTest && typeof globalThis !== 'undefined' ? globalThis.__CIVNEXA_TEST_FIXTURES__?.counseling : null;
    currentReferrals = fixtures || (testCounseling ? JSON.parse(JSON.stringify(testCounseling)) : []);
    saveReferrals(currentReferrals);
    return currentReferrals;
  },

  clearAllReferrals: () => {
    currentReferrals = [];
    saveReferrals([]);
    return [];
  },

  seedCounselingForTesting: (fixtures = []) => {
    currentReferrals = JSON.parse(JSON.stringify(fixtures || []));
    saveReferrals(currentReferrals);
    return currentReferrals;
  },

  /**
   * Retrieves counseling referrals with role-based masking of confidential clinical notes
   */
  getReferrals: async ({ status = 'ALL', searchQuery = '', currentUser = null } = {}) => {
    await new Promise((r) => setTimeout(r, 40));
    let items = loadReferrals();

    // Mask confidential notes if user is NOT authorized (only COORDINATOR, DEAN, SUPER_ADMIN can view clinical notes)
    const isAuthorizedForClinicalNotes =
      currentUser &&
      (currentUser.role === 'COORDINATOR' ||
        currentUser.role === 'DEAN' ||
        currentUser.role === 'SUPER_ADMIN');

    items = items.map((ref) => {
      const copy = { ...ref };
      if (!isAuthorizedForClinicalNotes) {
        copy.confidentialNotes = '[Confidential Clinical Counseling Note — Restricted to Welfare Coordinator & Dean]';
      }
      return copy;
    });

    if (status && status !== 'ALL') {
      items = items.filter((r) => r.status === status);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.caseNumber.toLowerCase().includes(q) ||
          r.studentName.toLowerCase().includes(q) ||
          r.studentRoll.toLowerCase().includes(q) ||
          r.studentDepartment.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
      );
    }

    return items;
  },

  getReferralById: async (id, currentUser = null) => {
    await new Promise((r) => setTimeout(r, 20));
    const items = loadReferrals();
    const found = items.find((r) => r.id === id || r.caseId === id || r.caseNumber === id);
    if (!found) throw new Error(`Counseling referral with ID ${id} not found.`);

    const isAuthorizedForClinicalNotes =
      currentUser &&
      (currentUser.role === 'COORDINATOR' ||
        currentUser.role === 'DEAN' ||
        currentUser.role === 'SUPER_ADMIN');

    const copy = JSON.parse(JSON.stringify(found));
    if (!isAuthorizedForClinicalNotes) {
      copy.confidentialNotes = '[Confidential Clinical Counseling Note — Restricted to Welfare Coordinator & Dean]';
    }
    return copy;
  },

  /**
   * Creates a new referral from an active case or committee review
   */
  createReferral: async ({
    caseId,
    caseNumber,
    studentId,
    studentName,
    studentRoll,
    studentDepartment,
    reason,
    priority = 'MEDIUM',
    referredBy,
  }) => {
    await new Promise((r) => setTimeout(r, 60));

    if (!reason || reason.trim() === '') {
      throw new Error('Referral reason is required.');
    }

    const items = loadReferrals();
    const nowIso = new Date().toISOString();
    const referralId = `REF-2026-${String(items.length + 1).padStart(3, '0')}`;
    const referrerName = referredBy?.name || 'Dean of Student Affairs';

    const newReferral = {
      id: referralId,
      caseId: caseId || 'CX-2026-GEN',
      caseNumber: caseNumber || caseId || 'CX-2026-GEN',
      studentId: studentId || 'STU-GEN',
      studentName: studentName || 'Student Appellant',
      studentRoll: studentRoll || 'N/A',
      studentDepartment: studentDepartment || 'General Department',
      reason: reason.trim(),
      referralDate: nowIso,
      referredBy: `${referrerName} (${referredBy?.role || 'DEAN'})`,
      priority,
      status: 'ACTIVE',
      counselor: 'Pooja Nambiar (Counseling Psychologist)',
      sessionsCount: 0,
      followupDate: null,
      confidentialNotes: 'Initial referral recorded. Intake session appointment pending.',
      sessions: [],
      followups: [],
    };

    if (getAuthToken()) {
      try {
        const resp = await apiClient.post('/counseling/referrals', {
          caseId: Number(caseId) || 1,
          studentId: Number(studentId) || 1,
          reason: reason.trim(),
          priority: priority,
        });
        const saved = resp?.data || resp;
        if (saved?.id) {
          newReferral.numericId = saved.id;
          newReferral.referralNumber = saved.referralNumber || newReferral.id;
        }
      } catch (e) {
        console.warn('Backend counseling referral skipped', e);
      }
    }

    items.push(newReferral);
    saveReferrals(items);
    currentReferrals = items;

    // Log activity on the case docket
    if (caseId) {
      try {
        await caseService.addInvestigationNote(caseId, {
          noteText: `Student referred to Student Counseling & Wellbeing Center. Reason: ${reason.trim()}. Referred by ${referrerName}.`,
          author: referredBy,
        });
      } catch (e) {
        console.warn('Sync note to caseService:', e);
      }
    }

    return newReferral;
  },

  /**
   * Schedules a new counseling appointment session under a referral
   */
  scheduleSession: async (
    referralId,
    { date, time, venue, counselor, type = 'Behavioral Support & Reflection', notes = '' }
  ) => {
    await new Promise((r) => setTimeout(r, 50));
    const items = loadReferrals();
    const index = items.findIndex((r) => r.id === referralId);
    if (index === -1) throw new Error(`Referral ${referralId} not found.`);

    if (!date || !time) throw new Error('Session date and time are required.');

    const newSession = {
      id: `CS-${Date.now()}`,
      date,
      time,
      venue: venue || 'Counseling Center, Suite B',
      counselor: counselor || 'Pooja Nambiar',
      type,
      attendanceStatus: 'SCHEDULED', // SCHEDULED, ATTENDED, MISSED
      sessionStatus: 'SCHEDULED',    // SCHEDULED, COMPLETED, FOLLOW_UP_REQUIRED, MISSED
      summary: notes || 'Upcoming counseling and mentorship session.',
      followupRequired: false,
      followupDate: null,
      conductedAt: null,
    };

    items[index].sessions = [...(items[index].sessions || []), newSession];
    items[index].sessionsCount = items[index].sessions.length;

    saveReferrals(items);
    currentReferrals = items;
    return newSession;
  },

  /**
   * Records attendance and outcome for a counseling session
   */
  recordSessionAttendance: async (
    referralId,
    sessionId,
    { attendanceStatus, sessionStatus, summary, followupRequired = false, followupDate = null, counselor }
  ) => {
    await new Promise((r) => setTimeout(r, 60));
    const items = loadReferrals();
    const refIndex = items.findIndex((r) => r.id === referralId);
    if (refIndex === -1) throw new Error(`Referral ${referralId} not found.`);

    const sIndex = (items[refIndex].sessions || []).findIndex((s) => s.id === sessionId);
    if (sIndex === -1) throw new Error(`Session ${sessionId} not found.`);

    const nowIso = new Date().toISOString();

    items[refIndex].sessions[sIndex].attendanceStatus = attendanceStatus;
    items[refIndex].sessions[sIndex].sessionStatus = sessionStatus;
    items[refIndex].sessions[sIndex].summary = summary.trim();
    items[refIndex].sessions[sIndex].followupRequired = followupRequired;
    items[refIndex].sessions[sIndex].followupDate = followupDate;
    items[refIndex].sessions[sIndex].conductedAt = nowIso;

    if (followupRequired && followupDate) {
      items[refIndex].followupDate = followupDate;
      const newFollowup = {
        id: `FW-${Date.now()}`,
        date: followupDate,
        objective: `Post-session follow-up review (${summary.substring(0, 40)}...)`,
        status: 'PENDING',
        outcome: '',
      };
      items[refIndex].followups = [...(items[refIndex].followups || []), newFollowup];
    }

    saveReferrals(items);
    currentReferrals = items;
    return items[refIndex].sessions[sIndex];
  },

  /**
   * Completes a welfare follow-up check
   */
  completeFollowup: async (referralId, followupId, { outcomeNotes, counselor }) => {
    await new Promise((r) => setTimeout(r, 50));
    const items = loadReferrals();
    const refIndex = items.findIndex((r) => r.id === referralId);
    if (refIndex === -1) throw new Error(`Referral ${referralId} not found.`);

    const fwIndex = (items[refIndex].followups || []).findIndex((f) => f.id === followupId);
    if (fwIndex === -1) throw new Error(`Followup ${followupId} not found.`);

    items[refIndex].followups[fwIndex].status = 'COMPLETED';
    items[refIndex].followups[fwIndex].outcome = outcomeNotes.trim();
    items[refIndex].followups[fwIndex].completedAt = new Date().toISOString();

    saveReferrals(items);
    currentReferrals = items;
    return items[refIndex].followups[fwIndex];
  },

  /**
   * Closes a completed counseling referral
   */
  closeReferral: async (referralId, { summary, closedBy }) => {
    await new Promise((r) => setTimeout(r, 50));
    const items = loadReferrals();
    const refIndex = items.findIndex((r) => r.id === referralId);
    if (refIndex === -1) throw new Error(`Referral ${referralId} not found.`);

    const nowIso = new Date().toISOString();
    items[refIndex].status = 'COMPLETED';
    items[refIndex].closedAt = nowIso;
    items[refIndex].closureSummary = summary.trim();
    items[refIndex].closedBy = closedBy?.name || 'Counseling Psychologist';

    saveReferrals(items);
    currentReferrals = items;
    return items[refIndex];
  },

  /**
   * Calculates dynamic metrics for student welfare & counseling dashboards
   */
  getCounselingMetrics: async () => {
    await new Promise((r) => setTimeout(r, 30));
    const items = loadReferrals();
    const activeReferrals = items.filter((r) => r.status === 'ACTIVE').length;
    const completedReferrals = items.filter((r) => r.status === 'COMPLETED').length;

    let scheduledSessions = 0;
    let pendingFollowups = 0;

    items.forEach((r) => {
      (r.sessions || []).forEach((s) => {
        if (s.attendanceStatus === 'SCHEDULED' || s.sessionStatus === 'SCHEDULED') {
          scheduledSessions++;
        }
      });
      (r.followups || []).forEach((f) => {
        if (f.status === 'PENDING') {
          pendingFollowups++;
        }
      });
    });

    const atRiskCount = items.filter(
      (r) => r.priority === 'HIGH' || r.priority === 'CRITICAL'
    ).length;

    return {
      totalReferrals: items.length,
      activeReferrals,
      completedReferrals,
      scheduledSessions,
      pendingFollowups,
      atRiskCount,
    };
  },
};

export default counselingService;
