// Case management service with dynamic statistics, interactive workflows, and audit logging
// Phase FE-3: Verification Queue, Incident Creation, Grievance Submission, Investigation & Hearings
import { runStorageMigration } from './storageMigration.js';

// Run targeted migration to clear old demo fixtures from storage
runStorageMigration();

const STORAGE_KEY = 'civnexa_cases_store';

const loadStoredCases = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored cases from localStorage', e);
  }
  // Default to empty array - NO hardcoded demo records in normal application usage
  return [];
};

const saveCases = (cases) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    }
  } catch (e) {
    console.warn('Failed to save cases to localStorage', e);
  }
};

let currentCases = loadStoredCases();

// Generate unique sequential case reference ID
const generateCaseReference = (prefix = 'CX') => {
  const year = new Date().getFullYear();
  const existingRefs = currentCases.map((c) => c.caseNumber || c.id);
  let nextNum = 109;
  while (existingRefs.includes(`${prefix}-${year}-0${nextNum}`) || existingRefs.includes(`${prefix}-${year}-${nextNum}`)) {
    nextNum++;
  }
  const padded = nextNum < 1000 ? String(nextNum).padStart(4, '0') : String(nextNum);
  return `${prefix}-${year}-${padded}`;
};

export const caseService = {
  /**
   * Get all cases with comprehensive filtering, search, sorting, and pagination
   */
  getCases: async ({
    search = '',
    category = 'ALL',
    status = 'ALL',
    priority = 'ALL',
    department = 'ALL',
    assignedAuthority = 'ALL',
    dateFrom = null,
    dateTo = null,
    quickFilter = 'ALL',
    currentUser = null,
    role = null,
    page = 1,
    pageSize = 10,
    sortBy = null,
    sortOrder = 'desc',
  } = {}) => {
    await new Promise((r) => setTimeout(r, 40));

    let filtered = [...currentCases];

    // Role-based visibility scoping
    const userRole = role || currentUser?.role;
    if (userRole === 'STUDENT' && currentUser) {
      // Students see only their own cases or cases they reported
      filtered = filtered.filter(
        (c) =>
          c.student?.id === currentUser.id ||
          c.student?.email === currentUser.email ||
          c.reporter?.id === currentUser.id ||
          c.student?.name?.toLowerCase() === currentUser.name?.toLowerCase()
      );
    } else if (userRole === 'FACULTY' && currentUser) {
      // Faculty see cases reported by them or assigned to them
      filtered = filtered.filter(
        (c) =>
          c.reporter?.id === currentUser.id ||
          c.assignedTo?.id === currentUser.id ||
          c.departmentCode === currentUser.departmentCode ||
          c.department === currentUser.department
      );
    } else if (userRole === 'HOD' && currentUser) {
      // HOD sees department cases and assigned cases
      filtered = filtered.filter(
        (c) =>
          c.department === currentUser.department ||
          c.departmentCode === currentUser.departmentCode ||
          c.assignedTo?.id === currentUser.id
      );
    }

    // Confidential case redaction for unauthorized viewers
    const isCentralAuthority = ['SUPER_ADMIN', 'DEAN'].includes(userRole);
    filtered = filtered.map((c) => {
      if (c.isConfidential && !isCentralAuthority) {
        const isSubject = currentUser && c.student?.id === currentUser.id;
        const isReporter = currentUser && c.reporter?.id === currentUser.id;
        const isAssignee = currentUser && c.assignedTo?.id === currentUser.id;
        if (!isSubject && !isReporter && !isAssignee) {
          return {
            ...c,
            student: {
              ...c.student,
              name: 'Protected Student Identity',
              rollNo: 'CONFIDENTIAL',
              enrollmentNo: 'CONFIDENTIAL',
            },
          };
        }
      }
      return c;
    });

    // Multi-attribute search
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.caseNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.student?.name?.toLowerCase().includes(q) ||
          c.student?.rollNo?.toLowerCase().includes(q) ||
          (c.student?.enrollmentNo && c.student.enrollmentNo.toLowerCase().includes(q)) ||
          c.department.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          (c.location && c.location.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (category && category !== 'ALL') {
      filtered = filtered.filter((c) => c.categoryKey === category || c.category === category);
    }

    // Status filter
    if (status && status !== 'ALL') {
      filtered = filtered.filter((c) => c.status === status);
    }

    // Priority filter
    if (priority && priority !== 'ALL') {
      filtered = filtered.filter((c) => c.priority === priority);
    }

    // Department filter
    if (department && department !== 'ALL') {
      filtered = filtered.filter(
        (c) => c.department === department || c.departmentCode === department
      );
    }

    // Assigned authority filter
    if (assignedAuthority && assignedAuthority !== 'ALL') {
      filtered = filtered.filter(
        (c) => c.assignedTo?.id === assignedAuthority || c.assignedTo?.name === assignedAuthority
      );
    }

    // Date range filter
    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      filtered = filtered.filter((c) => new Date(c.incidentDate || c.reportedAt).getTime() >= fromTime);
    }
    if (dateTo) {
      const toTime = new Date(dateTo).getTime();
      filtered = filtered.filter((c) => new Date(c.incidentDate || c.reportedAt).getTime() <= toTime);
    }

    // Quick filter chips
    if (quickFilter && quickFilter !== 'ALL') {
      switch (quickFilter) {
        case 'PENDING_VERIFICATION':
          filtered = filtered.filter(
            (c) => c.verificationStatus === 'PENDING' || c.status === 'PENDING_VERIFICATION' || c.status === 'SUBMITTED'
          );
          break;
        case 'UNDER_INVESTIGATION':
          filtered = filtered.filter((c) => c.status === 'UNDER_INVESTIGATION' || c.status === 'INVESTIGATION');
          break;
        case 'AWAITING_RESPONSE':
          filtered = filtered.filter((c) => c.status === 'AWAITING_RESPONSE');
          break;
        case 'HEARING_SCHEDULED':
          filtered = filtered.filter((c) => c.status === 'HEARING_SCHEDULED');
          break;
        case 'RESOLVED':
          filtered = filtered.filter((c) => c.status === 'RESOLVED');
          break;
        case 'CLOSED':
          filtered = filtered.filter((c) => c.status === 'CLOSED');
          break;
        default:
          break;
      }
    }

    // Sorting (only when explicitly requested)
    if (sortBy) {
      filtered.sort((a, b) => {
        let valA = a[sortBy] || a.reportedAt;
        let valB = b[sortBy] || b.reportedAt;

        if (sortBy === 'priority') {
          const priorityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          valA = priorityRank[a.priority] || 0;
          valB = priorityRank[b.priority] || 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page: currentPage,
      totalPages,
      pageSize,
    };
  },

  /**
   * Get single case details by ID or reference number
   */
  getCaseById: async (id, currentUser = null) => {
    await new Promise((r) => setTimeout(r, 30));
    const found = currentCases.find((c) => c.id === id || c.caseNumber === id);
    if (!found) {
      throw new Error(`Case with ID ${id} not found`);
    }

    const c = JSON.parse(JSON.stringify(found));
    // Apply confidentiality masking if unauthorized
    if (c.isConfidential && currentUser) {
      const isCentral = ['SUPER_ADMIN', 'DEAN'].includes(currentUser.role);
      const isSubject = c.student?.id === currentUser.id;
      const isReporter = c.reporter?.id === currentUser.id;
      const isAssignee = c.assignedTo?.id === currentUser.id;
      if (!isCentral && !isSubject && !isReporter && !isAssignee) {
        c.student = {
          ...c.student,
          name: 'Protected Student Identity',
          rollNo: 'CONFIDENTIAL',
          enrollmentNo: 'CONFIDENTIAL',
        };
      }
    }
    return c;
  },

  /**
   * Calculate dynamic statistics strictly from dataset records
   */
  getCaseStats: async () => {
    await new Promise((r) => setTimeout(r, 30));
    const total = currentCases.length;
    const active = currentCases.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
    const critical = currentCases.filter((c) => c.priority === 'CRITICAL' && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
    const underReview = currentCases.filter(
      (c) => c.status === 'UNDER_REVIEW' || c.status === 'PENDING_VERIFICATION' || c.status === 'SUBMITTED'
    ).length;
    const pendingVerification = currentCases.filter(
      (c) => c.verificationStatus === 'PENDING' || c.status === 'PENDING_VERIFICATION'
    ).length;
    const resolved = currentCases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const confidential = currentCases.filter((c) => c.isConfidential).length;

    // Distribution by category
    const categoryDistribution = currentCases.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});

    // Distribution by status
    const statusDistribution = currentCases.reduce((acc, c) => {
      const key = c.statusLabel || c.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      active,
      critical,
      underReview,
      pendingVerification,
      resolved,
      confidential,
      categoryDistribution,
      statusDistribution,
    };
  },

  /**
   * Create a new incident case via multi-step wizard (Phase FE-3)
   */
  createCase: async ({
    student,
    category,
    categoryKey,
    subcategory,
    title,
    description,
    incidentDate,
    incidentTime,
    location,
    priority = 'MEDIUM',
    isConfidential = false,
    remarks = '',
    attachments = [],
    reporter,
  }) => {
    await new Promise((r) => setTimeout(r, 60));

    if (!student || !student.id) {
      throw new Error('Valid student profile must be selected.');
    }
    if (!title || title.trim() === '') {
      throw new Error('Incident title is required.');
    }
    if (!description || description.trim() === '') {
      throw new Error('Incident description is required.');
    }

    const caseNumber = generateCaseReference('CX');
    const nowIso = new Date().toISOString();

    const newCase = {
      id: caseNumber,
      caseNumber,
      title: title.trim(),
      category: category || 'Discipline & Misconduct',
      categoryKey: categoryKey || 'DISCIPLINE',
      subcategory: subcategory || 'General Incident',
      priority,
      status: 'PENDING_VERIFICATION',
      statusLabel: 'Pending Verification',
      verificationStatus: 'PENDING',
      department: student.department || 'Computer Science & Engineering',
      departmentCode: student.departmentCode || 'CSE',
      incidentDate: incidentDate ? new Date(incidentDate).toISOString() : nowIso,
      incidentTime: incidentTime || '12:00',
      reportedAt: nowIso,
      updatedAt: nowIso,
      isConfidential: Boolean(isConfidential),
      student: {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        enrollmentNo: student.enrollmentNo || student.rollNo,
        email: student.email,
        department: student.department,
        course: student.course || 'B.Tech',
        semester: student.semester || 'Semester 5',
        section: student.section || 'A',
        cgpa: student.cgpa || 7.5,
      },
      reporter: reporter
        ? {
            id: reporter.id,
            name: reporter.name,
            role: reporter.role,
            designation: reporter.title || reporter.roleLabel,
            department: reporter.department,
          }
        : {
            id: 'FAC-3104',
            name: 'Dr. Ramesh Iyer',
            role: 'FACULTY',
            designation: 'Assistant Professor',
            department: 'CSE',
          },
      assignedTo: null,
      location: location || 'Campus Main Ground',
      summary: description.trim(),
      remarks: remarks ? remarks.trim() : '',
      evidenceCount: attachments.length,
      witnessCount: 0,
      nextActionDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      evidence: attachments.map((att, idx) => ({
        id: `EV-NEW-${idx + 1}-${Date.now()}`,
        name: att.name || `evidence_${idx + 1}.pdf`,
        size: att.size || '500 KB',
        type: att.type || 'application/pdf',
        uploadedAt: nowIso,
        uploaderName: reporter?.name || 'Reporter',
        uploaderRole: reporter?.role || 'FACULTY',
        url: '#',
      })),
      timeline: [
        {
          id: `TL-NEW-${Date.now()}-1`,
          title: 'Case Submitted',
          description: `Incident logged and submitted for institutional review by ${reporter?.name || 'Staff'}.`,
          timestamp: nowIso,
          actor: `${reporter?.name || 'Staff'} (${reporter?.role || 'FACULTY'})`,
          status: 'PENDING_VERIFICATION',
        },
      ],
      investigation: {
        investigator: null,
        startedAt: null,
        notes: [],
        requestedInfo: 'Awaiting initial Dean / HOD verification before review assignment.',
        nextAction: 'Pending verification queue clearance.',
      },
      hearings: [],
      responses: [],
      activities: [
        {
          id: `ACT-${Date.now()}-1`,
          action: 'Case Created',
          actor: {
            name: reporter?.name || 'Staff User',
            role: reporter?.role || 'FACULTY',
          },
          timestamp: nowIso,
          previousStatus: null,
          newStatus: 'PENDING_VERIFICATION',
          details: `Incident reported: "${title.trim()}". Placed in verification queue.`,
        },
      ],
    };

    currentCases.unshift(newCase);
    saveCases(currentCases);
    return newCase;
  },

  /**
   * Create a student grievance submission (Phase FE-3)
   */
  createGrievance: async ({
    category,
    categoryKey,
    subcategory,
    subject,
    description,
    incidentDate,
    location,
    concernedPerson = '',
    isAnonymous = false,
    attachments = [],
    reporter,
  }) => {
    await new Promise((r) => setTimeout(r, 60));

    if (!subject || subject.trim() === '') {
      throw new Error('Grievance subject is required.');
    }
    if (!description || description.trim() === '') {
      throw new Error('Grievance description is required.');
    }

    const caseNumber = generateCaseReference('GRV');
    const nowIso = new Date().toISOString();

    const studentInfo = isAnonymous
      ? {
          id: 'ANON-STUDENT',
          name: 'Anonymous Student Complainant',
          rollNo: 'ANON-ROLL',
          enrollmentNo: 'ANON-ENR',
          email: 'confidential@civnexa.edu',
          department: 'Confidential Department',
          course: 'B.Tech',
          semester: 'Confidential',
          section: 'N/A',
        }
      : {
          id: reporter?.id || 'STU-8821',
          name: reporter?.name || 'Aarav Sharma',
          rollNo: reporter?.rollNo || '22CSE041',
          enrollmentNo: reporter?.enrollmentNo || 'ENR-2022-CSE-0041',
          email: reporter?.email || 'student@civnexa.edu',
          department: reporter?.department || 'Computer Science & Engineering',
          course: 'B.Tech',
          semester: 'Semester 5',
          section: 'Section A',
        };

    const newGrievance = {
      id: caseNumber,
      caseNumber,
      title: subject.trim(),
      category: category || 'Academic Grievance',
      categoryKey: categoryKey || 'ACADEMIC_GRIEVANCE',
      subcategory: subcategory || 'Formal Student Grievance',
      priority: isAnonymous ? 'HIGH' : 'MEDIUM',
      status: 'PENDING_VERIFICATION',
      statusLabel: 'Pending Verification',
      verificationStatus: 'PENDING',
      department: reporter?.department || 'Computer Science & Engineering',
      departmentCode: reporter?.departmentCode || 'CSE',
      incidentDate: incidentDate ? new Date(incidentDate).toISOString() : nowIso,
      reportedAt: nowIso,
      updatedAt: nowIso,
      isConfidential: Boolean(isAnonymous),
      isAnonymous: Boolean(isAnonymous),
      student: studentInfo,
      reporter: isAnonymous
        ? {
            id: 'ANON-REPORTER',
            name: 'Anonymous Student Appellant',
            role: 'STUDENT',
            designation: 'Student (Identity Withheld)',
            department: 'Confidential',
          }
        : {
            id: reporter?.id || 'STU-8821',
            name: reporter?.name || 'Aarav Sharma',
            role: 'STUDENT',
            designation: 'Undergraduate Student Appellant',
            department: reporter?.department || 'CSE',
          },
      assignedTo: {
        id: 'ADM-002',
        name: 'Prof. Ananya Sen',
        role: 'DEAN',
        designation: 'Dean of Student Affairs',
      },
      location: location || 'Campus / Department Office',
      summary: description.trim(),
      concernedPerson: concernedPerson ? concernedPerson.trim() : '',
      evidenceCount: attachments.length,
      witnessCount: 0,
      nextActionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      evidence: attachments.map((att, idx) => ({
        id: `EV-GRV-${idx + 1}-${Date.now()}`,
        name: att.name || `grievance_doc_${idx + 1}.pdf`,
        size: att.size || '300 KB',
        type: att.type || 'application/pdf',
        uploadedAt: nowIso,
        uploaderName: isAnonymous ? 'Anonymous' : reporter?.name || 'Student',
        uploaderRole: 'STUDENT',
        url: '#',
      })),
      timeline: [
        {
          id: `TL-GRV-${Date.now()}-1`,
          title: 'Grievance Submitted',
          description: `Grievance lodged ${isAnonymous ? 'via confidential anonymous channel' : 'with formal institutional identity'}.`,
          timestamp: nowIso,
          actor: isAnonymous ? 'Anonymous Student' : `${reporter?.name || 'Student'} (Appellant)`,
          status: 'PENDING_VERIFICATION',
        },
      ],
      investigation: {
        investigator: null,
        startedAt: null,
        notes: [],
        requestedInfo: 'Grievance placed in Dean Verification Queue.',
        nextAction: 'Preliminary review by Proctorial Grievance Officer.',
      },
      hearings: [],
      responses: [],
      activities: [
        {
          id: `ACT-GRV-${Date.now()}-1`,
          action: 'Grievance Lodged',
          actor: {
            name: isAnonymous ? 'Anonymous Student' : reporter?.name || 'Student',
            role: 'STUDENT',
          },
          timestamp: nowIso,
          previousStatus: null,
          newStatus: 'PENDING_VERIFICATION',
          details: `Grievance reference ${caseNumber} created. Awaiting Dean verification.`,
        },
      ],
    };

    currentCases.unshift(newGrievance);
    saveCases(currentCases);
    return newGrievance;
  },

  /**
   * Dean / HOD Verification Queue Action (Phase FE-3)
   * Actions: 'VERIFY', 'RETURN', 'REJECT'
   */
  verifyCase: async (caseId, { action, notes = '', reason = '', verifiedBy }) => {
    await new Promise((r) => setTimeout(r, 60));
    const index = currentCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
    if (index === -1) throw new Error(`Case ${caseId} not found`);

    const c = currentCases[index];
    const nowIso = new Date().toISOString();
    const verifierName = verifiedBy?.name || 'Dean of Student Affairs';
    const verifierRole = verifiedBy?.role || 'DEAN';

    let newStatus = c.status;
    let newStatusLabel = c.statusLabel;
    let newVerificationStatus = c.verificationStatus;
    let actionTitle = '';
    let actionDetails = '';

    if (action === 'VERIFY') {
      newStatus = 'VERIFIED';
      newStatusLabel = 'Verified';
      newVerificationStatus = 'VERIFIED';
      actionTitle = 'Case Verified';
      actionDetails = `Verified by ${verifierName}. Verified as compliant with university review protocols. ${notes ? `Notes: ${notes}` : ''}`;
    } else if (action === 'RETURN') {
      newStatus = 'RETURNED_FOR_INFORMATION';
      newStatusLabel = 'Returned for Info';
      newVerificationStatus = 'RETURNED';
      actionTitle = 'Returned for Information';
      actionDetails = `Returned by ${verifierName} requesting further clarification: "${notes || reason || 'Additional documentation required'}".`;
    } else if (action === 'REJECT') {
      if (!reason || reason.trim() === '') {
        throw new Error('Mandatory reason is required to reject a case.');
      }
      newStatus = 'REJECTED';
      newStatusLabel = 'Rejected';
      newVerificationStatus = 'REJECTED';
      actionTitle = 'Case Rejected';
      actionDetails = `Rejected by ${verifierName}. Reason: "${reason.trim()}".`;
    }

    const updatedCase = {
      ...c,
      status: newStatus,
      statusLabel: newStatusLabel,
      verificationStatus: newVerificationStatus,
      updatedAt: nowIso,
      verification: {
        verifiedBy: verifierName,
        verifiedAt: nowIso,
        action,
        notes: notes || reason,
      },
      timeline: [
        ...(c.timeline || []),
        {
          id: `TL-VER-${Date.now()}`,
          title: actionTitle,
          description: actionDetails,
          timestamp: nowIso,
          actor: `${verifierName} (${verifierRole})`,
          status: newStatus,
        },
      ],
      activities: [
        {
          id: `ACT-VER-${Date.now()}`,
          action: actionTitle,
          actor: { name: verifierName, role: verifierRole },
          timestamp: nowIso,
          previousStatus: c.status,
          newStatus,
          details: actionDetails,
        },
        ...(c.activities || []),
      ],
    };

    currentCases[index] = updatedCase;
    saveCases(currentCases);
    return updatedCase;
  },

  /**
   * Assign case to an authorized reviewer/investigator
   */
  assignCase: async (caseId, { assignee, assignedBy, notes = '' }) => {
    await new Promise((r) => setTimeout(r, 60));
    const index = currentCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
    if (index === -1) throw new Error(`Case ${caseId} not found`);

    if (!assignee || !assignee.name) {
      throw new Error('An authorized reviewer or investigator must be specified.');
    }

    const c = currentCases[index];
    const nowIso = new Date().toISOString();
    const actorName = assignedBy?.name || 'Administrator';
    const actorRole = assignedBy?.role || 'HOD';

    const previousAssignee = c.assignedTo?.name || 'Unassigned';
    const newStatus = c.status === 'VERIFIED' || c.status === 'PENDING_VERIFICATION' ? 'ASSIGNED' : c.status;
    const newStatusLabel = newStatus === 'ASSIGNED' ? 'Assigned' : c.statusLabel;

    const details = `Case assigned to ${assignee.name} (${assignee.role || 'Reviewer'}) by ${actorName}. Previous: ${previousAssignee}. ${notes ? `Notes: ${notes}` : ''}`;

    const updatedCase = {
      ...c,
      status: newStatus,
      statusLabel: newStatusLabel,
      assignedTo: {
        id: assignee.id || 'USR-ASSIGNED',
        name: assignee.name,
        role: assignee.role || 'COMMITTEE_MEMBER',
        designation: assignee.designation || assignee.title || 'Inquiry Officer',
        department: assignee.department || c.department,
      },
      investigation: {
        ...(c.investigation || {}),
        investigator: assignee.name,
        startedAt: c.investigation?.startedAt || nowIso,
      },
      updatedAt: nowIso,
      timeline: [
        ...(c.timeline || []),
        {
          id: `TL-ASS-${Date.now()}`,
          title: 'Case Assigned',
          description: details,
          timestamp: nowIso,
          actor: `${actorName} (${actorRole})`,
          status: newStatus,
        },
      ],
      activities: [
        {
          id: `ACT-ASS-${Date.now()}`,
          action: 'Case Assigned',
          actor: { name: actorName, role: actorRole },
          timestamp: nowIso,
          previousStatus: c.status,
          newStatus,
          details,
        },
        ...(c.activities || []),
      ],
    };

    currentCases[index] = updatedCase;
    saveCases(currentCases);
    return updatedCase;
  },

  /**
   * Add an investigation note to case
   */
  addInvestigationNote: async (caseId, { noteText, author }) => {
    await new Promise((r) => setTimeout(r, 50));
    const index = currentCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
    if (index === -1) throw new Error(`Case ${caseId} not found`);

    if (!noteText || noteText.trim() === '') {
      throw new Error('Investigation note text is required.');
    }

    const c = currentCases[index];
    const nowIso = new Date().toISOString();
    const authorName = author?.name || 'Investigator';
    const authorRole = author?.role || 'COMMITTEE_MEMBER';

    const newNote = {
      id: `N-${Date.now()}`,
      author: authorName,
      timestamp: nowIso,
      text: noteText.trim(),
    };

    const updatedCase = {
      ...c,
      status: c.status === 'ASSIGNED' ? 'UNDER_INVESTIGATION' : c.status,
      statusLabel: c.status === 'ASSIGNED' ? 'Under Investigation' : c.statusLabel,
      updatedAt: nowIso,
      investigation: {
        ...(c.investigation || {}),
        notes: [...(c.investigation?.notes || []), newNote],
      },
      activities: [
        {
          id: `ACT-NOTE-${Date.now()}`,
          action: 'Investigation Note Added',
          actor: { name: authorName, role: authorRole },
          timestamp: nowIso,
          previousStatus: c.status,
          newStatus: c.status === 'ASSIGNED' ? 'UNDER_INVESTIGATION' : c.status,
          details: `Note added by ${authorName}: "${noteText.trim().substring(0, 80)}..."`,
        },
        ...(c.activities || []),
      ],
    };

    currentCases[index] = updatedCase;
    saveCases(currentCases);
    return updatedCase;
  },

  /**
   * Schedule a formal hearing
   */
  scheduleHearing: async (caseId, { date, time, venue, mode = 'In-Person', authorities = [], notes = '', scheduledBy }) => {
    await new Promise((r) => setTimeout(r, 60));
    const index = currentCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
    if (index === -1) throw new Error(`Case ${caseId} not found`);

    if (!date || !time) {
      throw new Error('Valid date and time are required for scheduling a hearing.');
    }
    if (!venue || venue.trim() === '') {
      throw new Error('Hearing venue or digital meeting link is required.');
    }

    const c = currentCases[index];
    const nowIso = new Date().toISOString();
    const actorName = scheduledBy?.name || 'Disciplinary Board';
    const actorRole = scheduledBy?.role || 'DEAN';

    const newHearing = {
      id: `H-${Date.now()}`,
      date,
      time,
      venue: venue.trim(),
      mode,
      authorities: authorities.length > 0 ? authorities : [actorName],
      notes: notes.trim(),
      status: 'SCHEDULED',
      scheduledAt: nowIso,
    };

    const details = `Formal hearing scheduled for ${date} at ${time} (${venue.trim()}). Mode: ${mode}.`;

    const updatedCase = {
      ...c,
      status: 'HEARING_SCHEDULED',
      statusLabel: 'Hearing Scheduled',
      updatedAt: nowIso,
      hearings: [...(c.hearings || []), newHearing],
      timeline: [
        ...(c.timeline || []),
        {
          id: `TL-HEAR-${Date.now()}`,
          title: 'Hearing Scheduled',
          description: details,
          timestamp: nowIso,
          actor: `${actorName} (${actorRole})`,
          status: 'HEARING_SCHEDULED',
        },
      ],
      activities: [
        {
          id: `ACT-HEAR-${Date.now()}`,
          action: 'Hearing Scheduled',
          actor: { name: actorName, role: actorRole },
          timestamp: nowIso,
          previousStatus: c.status,
          newStatus: 'HEARING_SCHEDULED',
          details,
        },
        ...(c.activities || []),
      ],
    };

    currentCases[index] = updatedCase;
    saveCases(currentCases);
    return updatedCase;
  },

  /**
   * Submit student explanation / defense response (Phase FE-3)
   */
  submitStudentResponse: async (caseId, { explanationText, attachments = [], student }) => {
    await new Promise((r) => setTimeout(r, 60));
    const index = currentCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
    if (index === -1) throw new Error(`Case ${caseId} not found`);

    if (!explanationText || explanationText.trim() === '') {
      throw new Error('Explanation statement is required.');
    }

    const c = currentCases[index];
    const nowIso = new Date().toISOString();
    const studentName = student?.name || c.student?.name || 'Student';
    const studentRoll = student?.rollNo || c.student?.rollNo || '';

    const newResponse = {
      id: `RESP-${Date.now()}`,
      text: explanationText.trim(),
      submittedAt: nowIso,
      studentName,
      studentRoll,
      status: 'SUBMITTED',
      attachments: attachments.map((att, idx) => ({
        id: `EV-RESP-${idx + 1}-${Date.now()}`,
        name: att.name || `student_response_doc_${idx + 1}.pdf`,
        size: att.size || '350 KB',
        type: att.type || 'application/pdf',
        uploadedAt: nowIso,
      })),
    };

    const details = `Formal explanation and defense response submitted by ${studentName} (${studentRoll}).`;

    const updatedCase = {
      ...c,
      status: 'UNDER_INVESTIGATION',
      statusLabel: 'Under Investigation',
      updatedAt: nowIso,
      responses: [...(c.responses || []), newResponse],
      evidence: [
        ...(c.evidence || []),
        ...newResponse.attachments.map((a) => ({
          ...a,
          uploaderName: studentName,
          uploaderRole: 'STUDENT',
          url: '#',
        })),
      ],
      evidenceCount: (c.evidenceCount || 0) + newResponse.attachments.length,
      timeline: [
        ...(c.timeline || []),
        {
          id: `TL-RESP-${Date.now()}`,
          title: 'Student Explanation Submitted',
          description: details,
          timestamp: nowIso,
          actor: `${studentName} (Student)`,
          status: 'UNDER_INVESTIGATION',
        },
      ],
      activities: [
        {
          id: `ACT-RESP-${Date.now()}`,
          action: 'Student Response Submitted',
          actor: { name: studentName, role: 'STUDENT' },
          timestamp: nowIso,
          previousStatus: c.status,
          newStatus: 'UNDER_INVESTIGATION',
          details,
        },
        ...(c.activities || []),
      ],
    };

    currentCases[index] = updatedCase;
    saveCases(currentCases);
    return updatedCase;
  },

  /**
   * Request formal explanation from student
   */
  requestStudentExplanation: async (caseId, { deadline, promptNotes = '', requestedBy }) => {
    await new Promise((r) => setTimeout(r, 50));
    const index = currentCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
    if (index === -1) throw new Error(`Case ${caseId} not found`);

    const c = currentCases[index];
    const nowIso = new Date().toISOString();
    const actorName = requestedBy?.name || 'Inquiry Officer';
    const actorRole = requestedBy?.role || 'HOD';

    const details = `Formal written explanation summoned from ${c.student?.name}. Deadline: ${deadline || 'Within 48 hours'}. ${promptNotes ? `Instructions: ${promptNotes}` : ''}`;

    const updatedCase = {
      ...c,
      status: 'AWAITING_RESPONSE',
      statusLabel: 'Awaiting Student Response',
      updatedAt: nowIso,
      nextActionDeadline: deadline || c.nextActionDeadline,
      timeline: [
        ...(c.timeline || []),
        {
          id: `TL-SUMM-${Date.now()}`,
          title: 'Explanation Demanded',
          description: details,
          timestamp: nowIso,
          actor: `${actorName} (${actorRole})`,
          status: 'AWAITING_RESPONSE',
        },
      ],
      activities: [
        {
          id: `ACT-SUMM-${Date.now()}`,
          action: 'Student Explanation Requested',
          actor: { name: actorName, role: actorRole },
          timestamp: nowIso,
          previousStatus: c.status,
          newStatus: 'AWAITING_RESPONSE',
          details,
        },
        ...(c.activities || []),
      ],
    };

    currentCases[index] = updatedCase;
    saveCases(currentCases);
    return updatedCase;
  },

  /**
   * Update a case's status interactively
   */
  updateCaseStatus: async (caseId, newStatus, newStatusLabel, actor = null, reason = '') => {
    await new Promise((r) => setTimeout(r, 60));
    const index = currentCases.findIndex((c) => c.id === caseId || c.caseNumber === caseId);
    if (index === -1) {
      throw new Error(`Case ${caseId} not found`);
    }

    const c = currentCases[index];
    const nowIso = new Date().toISOString();
    const actorName = actor?.name || 'Administrator';
    const actorRole = actor?.role || 'DEAN';

    const updatedCase = {
      ...c,
      status: newStatus,
      statusLabel: newStatusLabel || newStatus,
      updatedAt: nowIso,
      timeline: [
        ...(c.timeline || []),
        {
          id: `TL-STAT-${Date.now()}`,
          title: `Status Changed to ${newStatusLabel || newStatus}`,
          description: reason || `Case transitioned to ${newStatusLabel || newStatus} by ${actorName}.`,
          timestamp: nowIso,
          actor: `${actorName} (${actorRole})`,
          status: newStatus,
        },
      ],
      activities: [
        {
          id: `ACT-STAT-${Date.now()}`,
          action: 'Status Transition',
          actor: { name: actorName, role: actorRole },
          timestamp: nowIso,
          previousStatus: c.status,
          newStatus,
          details: reason || `Status updated from ${c.status} to ${newStatus}.`,
        },
        ...(c.activities || []),
      ],
    };

    currentCases[index] = updatedCase;
    saveCases(currentCases);
    return updatedCase;
  },

  /**
   * Get pending verification queue items
   */
  getVerificationQueue: async (department = null) => {
    await new Promise((r) => setTimeout(r, 40));
    let pending = currentCases.filter(
      (c) => c.verificationStatus === 'PENDING' || c.status === 'PENDING_VERIFICATION' || c.status === 'SUBMITTED'
    );
    if (department && department !== 'ALL') {
      pending = pending.filter(
        (c) => c.department === department || c.departmentCode === department
      );
    }
    return pending;
  },

  getCurrentCasesSync: () => [...currentCases],

  /**
   * Reset cases - in production resets to empty [] or supplied fixtures
   */
  resetMockData: (fixtures = null) => {
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    const testCases = isTest && typeof globalThis !== 'undefined' ? globalThis.__CIVNEXA_TEST_FIXTURES__?.cases : null;
    currentCases = fixtures || (testCases ? JSON.parse(JSON.stringify(testCases)) : []);
    saveCases(currentCases);
    return currentCases;
  },

  /**
   * Clear all cases to empty dataset
   */
  clearAllCases: () => {
    currentCases = [];
    saveCases([]);
    return [];
  },

  /**
   * Explicitly seed fixtures for automated tests
   */
  seedCasesForTesting: (fixtures = []) => {
    currentCases = JSON.parse(JSON.stringify(fixtures || []));
    saveCases(currentCases);
    return currentCases;
  },
};

export default caseService;
