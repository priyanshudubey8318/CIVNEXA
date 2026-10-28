// Hearing Management, Calendar & Minutes Service for CIVNEXA Phase FE-4
// Manages hearings, scheduling conflict detection, summons notices, minutes drafts, and outcomes.

import caseService from './caseService';

const STORAGE_KEY = 'civnexa_hearings_store';

const loadHearings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse hearings from storage', e);
    return [];
  }
};

const saveHearings = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save hearings to storage', e);
  }
};

let currentHearings = loadHearings();

export const hearingService = {
  resetMockData: (fixtures = null) => {
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    const testHearings = isTest && typeof globalThis !== 'undefined' ? globalThis.__CIVNEXA_TEST_FIXTURES__?.hearings : null;
    currentHearings = fixtures || (testHearings ? JSON.parse(JSON.stringify(testHearings)) : []);
    saveHearings(currentHearings);
    return currentHearings;
  },

  clearAllHearings: () => {
    currentHearings = [];
    saveHearings([]);
    return [];
  },

  seedHearingsForTesting: (fixtures = []) => {
    currentHearings = JSON.parse(JSON.stringify(fixtures || []));
    saveHearings(currentHearings);
    return currentHearings;
  },

  /**
   * Retrieves hearings filtered by month, date, status, or search query
   */
  getHearings: async ({
    month = null, // e.g. "2026-10"
    date = null,  // e.g. "2026-10-24"
    status = null,
    caseId = null,
    searchQuery = null,
    currentUser = null,
  } = {}) => {
    await new Promise((r) => setTimeout(r, 40));
    let items = loadHearings();

    // Scoping for students: only hearings concerning their own cases
    if (currentUser && currentUser.role === 'STUDENT') {
      const studentRoll = currentUser.rollNo || '22CSE041';
      items = items.filter(
        (h) => h.studentRoll === studentRoll || (h.studentName && h.studentName === currentUser.name)
      );
    }

    if (month) {
      items = items.filter((h) => h.date && h.date.startsWith(month));
    }

    if (date) {
      items = items.filter((h) => h.date === date);
    }

    if (status && status !== 'ALL') {
      items = items.filter((h) => h.status === status);
    }

    if (caseId && caseId !== 'ALL') {
      items = items.filter((h) => h.caseId === caseId || h.caseNumber === caseId);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (h) =>
          h.hearingNumber.toLowerCase().includes(q) ||
          h.caseNumber.toLowerCase().includes(q) ||
          h.caseTitle.toLowerCase().includes(q) ||
          (h.studentName && h.studentName.toLowerCase().includes(q)) ||
          h.venue.toLowerCase().includes(q) ||
          (h.presidingAuthority && h.presidingAuthority.toLowerCase().includes(q))
      );
    }

    // Sort by date and time
    items.sort((a, b) => {
      const dateTimeA = `${a.date}T${a.time}`;
      const dateTimeB = `${b.date}T${b.time}`;
      return dateTimeA.localeCompare(dateTimeB);
    });

    return items;
  },

  getHearingById: async (id) => {
    await new Promise((r) => setTimeout(r, 20));
    const items = loadHearings();
    const found = items.find((h) => h.id === id || h.hearingNumber === id);
    if (!found) {
      throw new Error(`Hearing with ID ${id} not found.`);
    }
    return JSON.parse(JSON.stringify(found));
  },

  /**
   * Conflict Detection: Checks if proposed hearing conflicts with existing hearings.
   * Compares date, time overlap, venue, and presiding authority.
   */
  checkSchedulingConflict: ({
    hearingIdToIgnore = null,
    date,
    time,
    endTime,
    venue,
    presidingAuthority,
  }) => {
    const items = loadHearings();
    const targetStart = `${date}T${time}`;
    const targetEnd = `${date}T${endTime || time}`;

    const conflicts = [];

    for (const h of items) {
      // Don't compare against itself when rescheduling
      if (hearingIdToIgnore && (h.id === hearingIdToIgnore || h.hearingNumber === hearingIdToIgnore)) {
        continue;
      }
      if (h.status === 'CANCELLED') continue;

      if (h.date === date) {
        const hStart = `${h.date}T${h.time}`;
        const hEnd = `${h.date}T${h.endTime || h.time}`;

        // Check time overlap: (StartA < EndB) and (EndA > StartB)
        const overlaps = targetStart < hEnd && targetEnd > hStart;

        if (overlaps) {
          // Check venue collision
          if (
            venue &&
            h.venue &&
            venue.trim().toLowerCase() === h.venue.trim().toLowerCase()
          ) {
            conflicts.push({
              type: 'VENUE_CONFLICT',
              message: `Venue conflict: "${venue}" is already booked for Hearing ${h.hearingNumber} (${h.caseNumber}) from ${h.time} to ${h.endTime || 'close'}.`,
              conflictingHearing: h,
            });
          }

          // Check presiding authority collision
          if (
            presidingAuthority &&
            h.presidingAuthority &&
            presidingAuthority.trim().toLowerCase() === h.presidingAuthority.trim().toLowerCase()
          ) {
            conflicts.push({
              type: 'AUTHORITY_CONFLICT',
              message: `Presiding authority conflict: ${presidingAuthority} is already chairing Hearing ${h.hearingNumber} (${h.caseNumber}) at this time.`,
              conflictingHearing: h,
            });
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  },

  /**
   * Schedules a new hearing with validation and conflict checking
   */
  scheduleHearing: async ({
    caseId,
    caseNumber,
    caseTitle,
    studentName,
    studentRoll,
    date,
    time,
    endTime,
    venue,
    mode = 'In-Person',
    presidingAuthority,
    committeeMembers = [],
    remarks = '',
    scheduledBy,
    bypassConflictWarning = false,
  }) => {
    await new Promise((r) => setTimeout(r, 60));

    if (!caseId || !date || !time || !venue) {
      throw new Error('Case reference, date, start time, and venue are required.');
    }

    if (endTime && endTime <= time) {
      throw new Error('End time must not precede or match start time.');
    }

    // Run conflict check
    const conflictCheck = hearingService.checkSchedulingConflict({
      date,
      time,
      endTime,
      venue,
      presidingAuthority,
    });

    if (conflictCheck.hasConflict && !bypassConflictWarning) {
      const err = new Error(conflictCheck.conflicts[0].message);
      err.conflictDetails = conflictCheck.conflicts;
      throw err;
    }

    const items = loadHearings();
    const nowIso = new Date().toISOString();
    const hearingNumber = `H-2026-${String(items.length + 1).padStart(3, '0')}`;

    const newHearing = {
      id: hearingNumber,
      hearingNumber,
      caseId,
      caseNumber: caseNumber || caseId,
      caseTitle: caseTitle || 'Proctorial Hearing',
      studentName: studentName || 'Subject Student',
      studentRoll: studentRoll || 'N/A',
      date,
      time,
      endTime: endTime || time,
      venue: venue.trim(),
      mode,
      presidingAuthority: presidingAuthority || 'Prof. Ananya Sen (Dean of Student Affairs)',
      committeeMembers: committeeMembers.length > 0 ? committeeMembers : ['Dr. Alok Nath'],
      status: 'SCHEDULED',
      remarks: remarks.trim(),
      scheduledAt: nowIso,
      scheduledBy: scheduledBy?.name || 'Dean of Student Affairs',
      notices: [
        {
          id: `NOT-2026-${String(Date.now()).slice(-4)}`,
          recipientType: 'STUDENT',
          recipientName: studentName || 'Subject Student',
          recipientRoll: studentRoll || 'N/A',
          status: 'ISSUED',
          issuedAt: nowIso,
          venue: venue.trim(),
          date,
          time,
          notes: 'Official hearing summons issued by Disciplinary Committee.',
        },
      ],
      minutes: null,
      outcome: null,
    };

    items.push(newHearing);
    saveHearings(items);
    currentHearings = items;

    // Synchronize with caseService
    try {
      await caseService.scheduleHearing(caseId, {
        date,
        time,
        venue,
        mode,
        authorities: committeeMembers,
        notes: remarks,
        scheduledBy,
      });
    } catch (e) {
      console.warn('Sync with caseService completed or already logged:', e.message);
    }

    return newHearing;
  },

  /**
   * Reschedules an existing hearing
   */
  rescheduleHearing: async (
    hearingId,
    {
      date,
      time,
      endTime,
      venue,
      mode,
      reason = '',
      rescheduledBy,
      bypassConflictWarning = false,
    }
  ) => {
    await new Promise((r) => setTimeout(r, 60));
    const items = loadHearings();
    const index = items.findIndex((h) => h.id === hearingId || h.hearingNumber === hearingId);
    if (index === -1) {
      throw new Error(`Hearing ${hearingId} not found.`);
    }

    if (endTime && endTime <= time) {
      throw new Error('End time must not precede or match start time.');
    }

    // Run conflict check
    const conflictCheck = hearingService.checkSchedulingConflict({
      hearingIdToIgnore: hearingId,
      date,
      time,
      endTime,
      venue,
      presidingAuthority: items[index].presidingAuthority,
    });

    if (conflictCheck.hasConflict && !bypassConflictWarning) {
      const err = new Error(conflictCheck.conflicts[0].message);
      err.conflictDetails = conflictCheck.conflicts;
      throw err;
    }

    const previousDate = items[index].date;
    const previousTime = items[index].time;
    const nowIso = new Date().toISOString();
    const actorName = rescheduledBy?.name || 'Proctorial Board';

    items[index].previousDate = `${previousDate} at ${previousTime}`;
    items[index].date = date;
    items[index].time = time;
    if (endTime) items[index].endTime = endTime;
    if (venue) items[index].venue = venue.trim();
    if (mode) items[index].mode = mode;
    items[index].status = 'RESCHEDULED';
    items[index].rescheduleReason = reason.trim();
    items[index].rescheduledAt = nowIso;
    items[index].rescheduledBy = actorName;

    // Issue updated notice
    items[index].notices = [
      ...(items[index].notices || []),
      {
        id: `NOT-2026-${String(Date.now()).slice(-4)}`,
        recipientType: 'STUDENT',
        recipientName: items[index].studentName,
        recipientRoll: items[index].studentRoll,
        status: 'RESCHEDULED',
        issuedAt: nowIso,
        venue: venue || items[index].venue,
        date,
        time,
        notes: `Hearing rescheduled from ${previousDate} ${previousTime} to ${date} ${time}. Reason: ${reason || 'Administrative adjustment'}`,
      },
    ];

    saveHearings(items);
    currentHearings = items;

    // Synchronize case activity
    try {
      await caseService.addInvestigationNote(items[index].caseId, {
        noteText: `Hearing ${items[index].hearingNumber} rescheduled to ${date} at ${time} (${venue || items[index].venue}). Reason: ${reason || 'Administrative rescheduling'}.`,
        author: rescheduledBy,
      });
    } catch (e) {
      console.warn('Sync with case notes completed:', e);
    }

    return items[index];
  },

  /**
   * Prepares and updates hearing summons notice
   */
  prepareNotice: async (hearingId, { recipientType, recipientName, recipientRoll, notes = '' }) => {
    await new Promise((r) => setTimeout(r, 40));
    const items = loadHearings();
    const index = items.findIndex((h) => h.id === hearingId || h.hearingNumber === hearingId);
    if (index === -1) throw new Error(`Hearing ${hearingId} not found.`);

    const nowIso = new Date().toISOString();
    const newNotice = {
      id: `NOT-2026-${String(Date.now()).slice(-4)}`,
      recipientType: recipientType || 'STUDENT',
      recipientName: recipientName || items[index].studentName,
      recipientRoll: recipientRoll || items[index].studentRoll,
      status: 'PREPARED',
      issuedAt: nowIso,
      venue: items[index].venue,
      date: items[index].date,
      time: items[index].time,
      notes: notes.trim() || 'Official Notice of Hearing Appearance before Disciplinary Committee.',
    };

    items[index].notices = [...(items[index].notices || []), newNotice];
    saveHearings(items);
    currentHearings = items;
    return newNotice;
  },

  /**
   * Updates notice status (e.g. from PREPARED -> ISSUED or ISSUED -> ACKNOWLEDGED)
   */
  updateNoticeStatus: async (hearingId, noticeId, newStatus) => {
    await new Promise((r) => setTimeout(r, 30));
    const items = loadHearings();
    const hIndex = items.findIndex((h) => h.id === hearingId || h.hearingNumber === hearingId);
    if (hIndex === -1) throw new Error(`Hearing ${hearingId} not found.`);

    const noticeIndex = (items[hIndex].notices || []).findIndex((n) => n.id === noticeId);
    if (noticeIndex === -1) throw new Error(`Notice ${noticeId} not found.`);

    items[hIndex].notices[noticeIndex].status = newStatus;
    items[hIndex].notices[noticeIndex].updatedAt = new Date().toISOString();

    saveHearings(items);
    currentHearings = items;
    return items[hIndex].notices[noticeIndex];
  },

  /**
   * Saves hearing minutes as draft or submits formal minutes
   */
  saveHearingMinutes: async (
    hearingId,
    {
      participantsPresent = [],
      participantsAbsent = [],
      topicsDiscussed = '',
      documentsConsidered = [],
      summary = '',
      additionalInfoRequested = '',
      nextSteps = '',
      isDraft = false,
      recordedBy,
    }
  ) => {
    await new Promise((r) => setTimeout(r, 60));
    const items = loadHearings();
    const index = items.findIndex((h) => h.id === hearingId || h.hearingNumber === hearingId);
    if (index === -1) throw new Error(`Hearing ${hearingId} not found.`);

    if (!isDraft) {
      if (!summary || summary.trim().length < 15) {
        throw new Error('Summary of proceedings must be at least 15 characters.');
      }
      if (!topicsDiscussed || topicsDiscussed.trim().length < 5) {
        throw new Error('Topics discussed must be specified.');
      }
    }

    const nowIso = new Date().toISOString();
    const recorderName = recordedBy?.name || 'Dr. Alok Nath';
    const existingMinutes = items[index].minutes;

    // Check if amending previously submitted minutes
    const isAmendment = existingMinutes && !existingMinutes.draft && !isDraft;

    const minutesRecord = {
      id: existingMinutes?.id || `MIN-2026-${String(Date.now()).slice(-4)}`,
      draft: isDraft,
      hearingDate: items[index].date,
      participantsPresent:
        participantsPresent.length > 0 ? participantsPresent : ['Prof. Ananya Sen', 'Dr. Alok Nath'],
      participantsAbsent,
      topicsDiscussed: topicsDiscussed.trim(),
      documentsConsidered,
      summary: summary.trim(),
      additionalInfoRequested: additionalInfoRequested.trim(),
      nextSteps: nextSteps.trim(),
      recordedBy: recorderName,
      recordedAt: nowIso,
      amendments: isAmendment
        ? [
            ...(existingMinutes.amendments || []),
            {
              id: `AMD-${Date.now()}`,
              amendedBy: recorderName,
              amendedAt: nowIso,
              previousSummary: existingMinutes.summary,
            },
          ]
        : existingMinutes?.amendments || [],
    };

    items[index].minutes = minutesRecord;
    if (!isDraft) {
      items[index].status = 'COMPLETED';
    } else {
      items[index].status = 'AWAITING_MINUTES';
    }

    saveHearings(items);
    currentHearings = items;

    // Add activity to related case
    try {
      await caseService.addInvestigationNote(items[index].caseId, {
        noteText: isDraft
          ? `Draft minutes saved for Hearing ${items[index].hearingNumber} by ${recorderName}.`
          : `Official Hearing Minutes submitted for Hearing ${items[index].hearingNumber}. Summary: ${summary.trim().substring(0, 80)}...`,
        author: recordedBy,
      });
    } catch (e) {
      console.warn('Sync with case notes completed:', e);
    }

    return minutesRecord;
  },

  /**
   * Records formal hearing outcome
   */
  recordHearingOutcome: async (
    hearingId,
    { outcome, notes = '', nextHearingDate = null, recordedBy }
  ) => {
    await new Promise((r) => setTimeout(r, 60));
    const items = loadHearings();
    const index = items.findIndex((h) => h.id === hearingId || h.hearingNumber === hearingId);
    if (index === -1) throw new Error(`Hearing ${hearingId} not found.`);

    if (!outcome) {
      throw new Error('Hearing outcome category is required.');
    }

    const nowIso = new Date().toISOString();
    const actorName = recordedBy?.name || 'Disciplinary Board';

    items[index].outcome = outcome;
    items[index].outcomeNotes = notes.trim();
    items[index].outcomeRecordedBy = actorName;
    items[index].outcomeRecordedAt = nowIso;
    items[index].status = 'COMPLETED';

    saveHearings(items);
    currentHearings = items;

    // Log in case activities
    try {
      await caseService.addInvestigationNote(items[index].caseId, {
        noteText: `Formal outcome recorded for Hearing ${items[index].hearingNumber}: "${outcome}". Notes: ${notes.trim() || 'Proceedings concluded.'}`,
        author: recordedBy,
      });
    } catch (e) {
      console.warn('Sync with case outcome completed:', e);
    }

    return items[index];
  },
};

export default hearingService;
