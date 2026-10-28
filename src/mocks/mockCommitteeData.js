// Mock Data for Phase FE-4: Disciplinary Committee, Evidence Vault & Hearing Management
// Deterministic seed datasets for Committee Reviews, Hearings, Evidence Vault, and Counseling Referrals.

export const INITIAL_HEARINGS = [
  {
    id: "H-2026-001",
    hearingNumber: "H-2026-001",
    caseId: "CX-2026-0101",
    caseNumber: "CX-2026-0101",
    caseTitle: "Unauthorized electronic device detected during End-Semester Examination",
    studentName: "Aarav Sharma",
    studentRoll: "22CSE041",
    date: "2026-10-24",
    time: "10:30",
    endTime: "11:30",
    venue: "Senate Chamber, Admin Block A",
    mode: "In-Person",
    presidingAuthority: "Prof. Ananya Sen (Dean of Student Affairs)",
    committeeMembers: [
      "Dr. Alok Nath (Ethics Reviewer)",
      "Prof. Sunita Mehta (HOD, CSE)",
      "Dr. Ramesh Iyer (Invigilator)"
    ],
    status: "SCHEDULED", // SCHEDULED, COMPLETED, RESCHEDULED, CANCELLED, AWAITING_MINUTES
    remarks: "Formal proctorial inquiry into confiscated smartwatch during CS301 exam.",
    scheduledAt: "2026-10-19T14:00:00Z",
    scheduledBy: "Prof. Ananya Sen",
    notices: [
      {
        id: "NOT-2026-001",
        recipientType: "STUDENT",
        recipientName: "Aarav Sharma",
        recipientRoll: "22CSE041",
        status: "ISSUED", // DRAFT, PREPARED, ISSUED, ACKNOWLEDGED, CANCELLED, RESCHEDULED
        issuedAt: "2026-10-19T15:00:00Z",
        venue: "Senate Chamber, Admin Block A",
        date: "2026-10-24",
        time: "10:30",
        notes: "Mandatory student appearance before Proctorial Ethics Committee."
      },
      {
        id: "NOT-2026-002",
        recipientType: "COMMITTEE",
        recipientName: "Dr. Alok Nath",
        status: "ACKNOWLEDGED",
        issuedAt: "2026-10-19T15:00:00Z",
        venue: "Senate Chamber, Admin Block A",
        date: "2026-10-24",
        time: "10:30",
        notes: "Proctorial Board review docket package dispatched."
      }
    ],
    minutes: null,
    outcome: null
  },
  {
    id: "H-2026-002",
    hearingNumber: "H-2026-002",
    caseId: "CX-2026-0106",
    caseNumber: "CX-2026-0106",
    caseTitle: "Alleged ragging and intimidating demands made to 1st year hostel residents",
    studentName: "Aarav Sharma",
    studentRoll: "22CSE041",
    date: "2026-10-26",
    time: "14:00",
    endTime: "15:30",
    venue: "Proctorial Conference Suite 2",
    mode: "In-Person",
    presidingAuthority: "Prof. Ananya Sen (Dean of Student Affairs)",
    committeeMembers: [
      "Dr. Alok Nath (Ethics Reviewer)",
      "Rajesh Verma (Hostel Warden)",
      "Pooja Nambiar (Counseling Psychologist)"
    ],
    status: "SCHEDULED",
    remarks: "Anti-Ragging statutory inquiry following junior student representation.",
    scheduledAt: "2026-10-21T11:00:00Z",
    scheduledBy: "Prof. Ananya Sen",
    notices: [
      {
        id: "NOT-2026-003",
        recipientType: "STUDENT",
        recipientName: "Aarav Sharma",
        recipientRoll: "22CSE041",
        status: "ISSUED",
        issuedAt: "2026-10-21T11:30:00Z",
        venue: "Proctorial Conference Suite 2",
        date: "2026-10-26",
        time: "14:00",
        notes: "Statutory 48-hour hearing notice under UGC Anti-Ragging regulations."
      }
    ],
    minutes: null,
    outcome: null
  },
  {
    id: "H-2026-003",
    hearingNumber: "H-2026-003",
    caseId: "CX-2026-0103",
    caseNumber: "CX-2026-0103",
    caseTitle: "Physical altercation and verbal abuse outside Main Dining Hall",
    studentName: "Tanmay Deshmukh",
    studentRoll: "23EE089",
    date: "2026-10-21",
    time: "11:00",
    endTime: "12:15",
    venue: "Boardroom A, Admin Block",
    mode: "In-Person",
    presidingAuthority: "Prof. Ananya Sen (Dean of Student Affairs)",
    committeeMembers: [
      "Dr. Alok Nath (Ethics Reviewer)",
      "Rajesh Verma (Chief Warden)"
    ],
    status: "AWAITING_MINUTES",
    remarks: "Hearing concluded; proceedings recording in progress.",
    scheduledAt: "2026-10-18T10:00:00Z",
    scheduledBy: "Prof. Ananya Sen",
    notices: [
      {
        id: "NOT-2026-004",
        recipientType: "STUDENT",
        recipientName: "Tanmay Deshmukh",
        recipientRoll: "23EE089",
        status: "ACKNOWLEDGED",
        issuedAt: "2026-10-18T10:30:00Z",
        venue: "Boardroom A, Admin Block",
        date: "2026-10-21",
        time: "11:00",
        notes: "Hearing notice acknowledged by student."
      }
    ],
    minutes: {
      id: "MIN-2026-001",
      draft: true,
      hearingDate: "2026-10-21",
      participantsPresent: ["Prof. Ananya Sen", "Dr. Alok Nath", "Rajesh Verma", "Tanmay Deshmukh"],
      participantsAbsent: [],
      topicsDiscussed: "Dining hall altercation, CCTV timestamp analysis, mutual apologies, behavioral history.",
      documentsConsidered: ["CCTV clip snippet (Dining Hall Gate 2)", "Medical dispensary first aid log", "Student written response"],
      summary: "Student admitted to losing composure during a verbal queue dispute. Emphasized lack of prior disciplinary infractions. Expressed sincere remorse.",
      additionalInfoRequested: "Dispensary discharge receipt confirmation.",
      nextSteps: "Draft committee recommendation for campus counseling and mutual peace bond.",
      recordedBy: "Dr. Alok Nath",
      recordedAt: "2026-10-21T13:00:00Z"
    },
    outcome: "Committee Recommendation Pending"
  },
  {
    id: "H-2026-004",
    hearingNumber: "H-2026-004",
    caseId: "CX-2026-0105",
    caseNumber: "CX-2026-0105",
    caseTitle: "Hostel curfew violation and unauthorized guest accommodated overnight",
    studentName: "Aditya Nair",
    studentRoll: "22CV014",
    date: "2026-10-15",
    time: "15:00",
    endTime: "16:00",
    venue: "Hostel Warden Office, Block 3",
    mode: "In-Person",
    presidingAuthority: "Rajesh Verma (Chief Residential Warden)",
    committeeMembers: [
      "Dr. Alok Nath (Ethics Reviewer)",
      "Prof. Sunita Mehta"
    ],
    status: "COMPLETED",
    remarks: "Hearing completed. Formal hostel reprimand issued.",
    scheduledAt: "2026-10-12T09:00:00Z",
    scheduledBy: "Rajesh Verma",
    notices: [
      {
        id: "NOT-2026-005",
        recipientType: "STUDENT",
        recipientName: "Aditya Nair",
        status: "ACKNOWLEDGED",
        issuedAt: "2026-10-12T09:30:00Z",
        venue: "Hostel Warden Office, Block 3",
        date: "2026-10-15",
        time: "15:00",
        notes: "Hearing notice served via residential warden."
      }
    ],
    minutes: {
      id: "MIN-2026-002",
      draft: false,
      hearingDate: "2026-10-15",
      participantsPresent: ["Rajesh Verma", "Dr. Alok Nath", "Aditya Nair"],
      participantsAbsent: [],
      topicsDiscussed: "Night guest entry protocol, hostel security log review, guest identification verification.",
      documentsConsidered: ["Hostel Gate Register (Oct 10)", "Security guard written statement"],
      summary: "Student acknowledged guest stayed without prior guest pass due to late train arrival. Student had clear prior record.",
      additionalInfoRequested: "None.",
      nextSteps: "Hostel fine levied and undertaking signed.",
      recordedBy: "Dr. Alok Nath",
      recordedAt: "2026-10-15T16:30:00Z"
    },
    outcome: "Hearing Completed"
  }
];

export const INITIAL_COMMITTEE_REVIEWS = [
  {
    id: "REV-2026-001",
    caseId: "CX-2026-0101",
    caseNumber: "CX-2026-0101",
    title: "Unauthorized electronic device detected during End-Semester Examination",
    category: "Examination Incident",
    priority: "HIGH",
    assignedTo: "Dr. Alok Nath",
    status: "UNDER_REVIEW", // AWAITING_REVIEW, UNDER_REVIEW, RECOMMENDATION_DRAFTED, RECOMMENDATION_SUBMITTED, COMPLETED
    startDate: "2026-10-19T10:00:00Z",
    participatingMembers: ["Dr. Alok Nath", "Prof. Sunita Mehta", "Dr. Ramesh Iyer"],
    notes: [
      {
        id: "RN-01",
        author: "Dr. Alok Nath",
        role: "COMMITTEE_MEMBER",
        date: "2026-10-19T11:00:00Z",
        text: "Inspected seized smartwatch memory dump. Device had active Bluetooth connection to phone in coat outside hall."
      },
      {
        id: "RN-02",
        author: "Prof. Sunita Mehta",
        role: "HOD",
        date: "2026-10-20T10:00:00Z",
        text: "Invigilator statement verified. Student claims watch was worn inadvertently as an analog timepiece."
      }
    ],
    documentsConsidered: [
      "impounded_device_log.pdf",
      "seating_chart_signed.jpg",
      "invigilator_statement.pdf"
    ],
    recommendationDraft: {
      category: "Institutional policy-based action recommended",
      rationale: "Exam regulations clearly specify total ban on all wearable electronics regardless of active usage. Prima facie breach established.",
      proposedSanction: "Cancellation of Course CS301 examination credit for current semester with permission to re-appear in supplementary cycle.",
      followUp: "Academic counseling regarding ethical examination conduct.",
      isDraft: true,
      updatedAt: "2026-10-20T16:00:00Z"
    },
    submittedRecommendation: null
  },
  {
    id: "REV-2026-002",
    caseId: "CX-2026-0103",
    caseNumber: "CX-2026-0103",
    title: "Physical altercation and verbal abuse outside Main Dining Hall",
    category: "Discipline & Misconduct",
    priority: "MEDIUM",
    assignedTo: "Dr. Alok Nath",
    status: "RECOMMENDATION_SUBMITTED",
    startDate: "2026-10-18T10:00:00Z",
    participatingMembers: ["Dr. Alok Nath", "Rajesh Verma"],
    notes: [
      {
        id: "RN-03",
        author: "Dr. Alok Nath",
        role: "COMMITTEE_MEMBER",
        date: "2026-10-18T14:00:00Z",
        text: "CCTV shows both parties engaged in pushing before campus security separated them within 40 seconds."
      }
    ],
    documentsConsidered: [
      "cctv_hall_gate2.mp4",
      "dispensary_first_aid_log.pdf"
    ],
    recommendationDraft: null,
    submittedRecommendation: {
      category: "Counseling or mentoring recommended",
      rationale: "Mutual provocation established. Both students expressed immediate mutual apologies and showed clear remorse.",
      proposedSanction: "Mandatory attendance of 3 anger-management counseling sessions with Counseling Center, plus 10 hours community service in library.",
      followUp: "Coordinator Dr. Alok Verma to submit compliance report within 30 days.",
      submittedBy: "Dr. Alok Nath (Ethics Committee Lead)",
      submittedAt: "2026-10-21T15:30:00Z",
      status: "PENDING_DEAN_APPROVAL"
    }
  },
  {
    id: "REV-2026-003",
    caseId: "CX-2026-0106",
    caseNumber: "CX-2026-0106",
    title: "Alleged ragging and intimidating demands made to 1st year hostel residents",
    category: "Anti-Ragging (Strict Protocol)",
    priority: "CRITICAL",
    assignedTo: "Dr. Alok Nath",
    status: "AWAITING_REVIEW",
    startDate: "2026-10-21T09:00:00Z",
    participatingMembers: ["Dr. Alok Nath", "Prof. Ananya Sen", "Rajesh Verma"],
    notes: [],
    documentsConsidered: ["hostel_warden_preliminary_memo.pdf"],
    recommendationDraft: null,
    submittedRecommendation: null
  }
];

export const INITIAL_EVIDENCE_VAULT = [
  {
    id: "EV-01",
    fileId: "EV-01",
    caseId: "CX-2026-0101",
    caseNumber: "CX-2026-0101",
    name: "impounded_device_log.pdf",
    size: "420 KB",
    sizeBytes: 430080,
    type: "application/pdf",
    typeCategory: "DOCUMENT",
    uploadedAt: "2026-10-18T11:30:00Z",
    uploaderName: "Dr. Ramesh Iyer",
    uploaderRole: "FACULTY",
    description: "Invigilator report detailing confiscated digital watch with MAC address and serial number.",
    reviewStatus: "REVIEWED", // UNREVIEWED, REVIEWED, FLAGGED
    reviewNotes: "Serial number matched with student statement.",
    reviewedBy: "Dr. Alok Nath",
    reviewedAt: "2026-10-19T11:15:00Z",
    permittedRoles: ["SUPER_ADMIN", "DEAN", "HOD", "COMMITTEE_MEMBER"],
    isConfidential: false,
    sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    integrityVerifiedAt: "2026-10-19T11:15:00Z",
    custodyChain: [
      {
        id: "EACT-001",
        action: "Evidence Intake",
        actor: "Dr. Ramesh Iyer (FACULTY)",
        timestamp: "2026-10-18T11:30:00Z",
        details: "Document uploaded and added to initial incident docket."
      },
      {
        id: "EACT-002",
        action: "Opened for Review",
        actor: "Dr. Alok Nath (COMMITTEE_MEMBER)",
        timestamp: "2026-10-19T11:00:00Z",
        details: "Document accessed from Committee Review Workspace."
      },
      {
        id: "EACT-003",
        action: "Marked as Reviewed",
        actor: "Dr. Alok Nath (COMMITTEE_MEMBER)",
        timestamp: "2026-10-19T11:15:00Z",
        details: "Integrity verified via SHA-256. Notes added to review docket."
      }
    ]
  },
  {
    id: "EV-02",
    fileId: "EV-02",
    caseId: "CX-2026-0101",
    caseNumber: "CX-2026-0101",
    name: "seating_chart_signed.jpg",
    size: "1.2 MB",
    sizeBytes: 1258291,
    type: "image/jpeg",
    typeCategory: "IMAGE",
    uploadedAt: "2026-10-18T11:45:00Z",
    uploaderName: "Dr. Ramesh Iyer",
    uploaderRole: "FACULTY",
    description: "Hall 301 physical seating plan signed by both examination proctors.",
    reviewStatus: "REVIEWED",
    reviewNotes: "Desk 41 location confirmed in row 4 center aisle.",
    reviewedBy: "Dr. Alok Nath",
    reviewedAt: "2026-10-19T11:20:00Z",
    permittedRoles: ["SUPER_ADMIN", "DEAN", "HOD", "COMMITTEE_MEMBER"],
    isConfidential: false,
    sha256Checksum: "8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4",
    integrityVerifiedAt: "2026-10-19T11:20:00Z",
    custodyChain: [
      {
        id: "EACT-004",
        action: "Evidence Intake",
        actor: "Dr. Ramesh Iyer (FACULTY)",
        timestamp: "2026-10-18T11:45:00Z",
        details: "Signed seating chart scanned and ingested."
      },
      {
        id: "EACT-005",
        action: "Marked as Reviewed",
        actor: "Dr. Alok Nath (COMMITTEE_MEMBER)",
        timestamp: "2026-10-19T11:20:00Z",
        details: "Desk coordinate checked against invigilator observation point."
      }
    ]
  },
  {
    id: "EV-03",
    fileId: "EV-03",
    caseId: "CX-2026-0101",
    caseNumber: "CX-2026-0101",
    name: "invigilator_statement.pdf",
    size: "280 KB",
    sizeBytes: 286720,
    type: "application/pdf",
    typeCategory: "DOCUMENT",
    uploadedAt: "2026-10-18T12:00:00Z",
    uploaderName: "Dr. Ramesh Iyer",
    uploaderRole: "FACULTY",
    description: "Detailed chronological account of smartwatch detection and student notification.",
    reviewStatus: "UNREVIEWED",
    reviewNotes: "",
    reviewedBy: null,
    reviewedAt: null,
    permittedRoles: ["SUPER_ADMIN", "DEAN", "HOD", "COMMITTEE_MEMBER"],
    isConfidential: false,
    sha256Checksum: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    integrityVerifiedAt: null,
    custodyChain: [
      {
        id: "EACT-006",
        action: "Evidence Intake",
        actor: "Dr. Ramesh Iyer (FACULTY)",
        timestamp: "2026-10-18T12:00:00Z",
        details: "Official statement lodged."
      }
    ]
  },
  {
    id: "EV-04",
    fileId: "EV-04",
    caseId: "CX-2026-0102",
    caseNumber: "CX-2026-0102",
    name: "damaged_oscilloscope_panel.png",
    size: "3.4 MB",
    sizeBytes: 3565158,
    type: "image/png",
    typeCategory: "IMAGE",
    uploadedAt: "2026-10-19T10:15:00Z",
    uploaderName: "Kavita Deshmukh",
    uploaderRole: "STAFF",
    description: "High-resolution photograph of cracked LCD oscilloscope display in Physics Lab 102.",
    reviewStatus: "FLAGGED",
    reviewNotes: "Requires repair estimate from authorized instrument vendor.",
    reviewedBy: "Dr. Alok Nath",
    reviewedAt: "2026-10-20T14:10:00Z",
    permittedRoles: ["SUPER_ADMIN", "DEAN", "HOD", "COMMITTEE_MEMBER", "STAFF"],
    isConfidential: false,
    sha256Checksum: "fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9",
    integrityVerifiedAt: "2026-10-20T14:10:00Z",
    custodyChain: [
      {
        id: "EACT-007",
        action: "Evidence Intake",
        actor: "Kavita Deshmukh (STAFF)",
        timestamp: "2026-10-19T10:15:00Z",
        details: "Photograph taken immediately post-incident."
      },
      {
        id: "EACT-008",
        action: "Flagged for Verification",
        actor: "Dr. Alok Nath (COMMITTEE_MEMBER)",
        timestamp: "2026-10-20T14:10:00Z",
        details: "Flagged: requested quotation for screen repair from laboratory head."
      }
    ]
  },
  {
    id: "EV-05",
    fileId: "EV-05",
    caseId: "CX-2026-0103",
    caseNumber: "CX-2026-0103",
    name: "cctv_hall_gate2.mp4",
    size: "14.2 MB",
    sizeBytes: 14889779,
    type: "video/mp4",
    typeCategory: "VIDEO",
    uploadedAt: "2026-10-18T10:30:00Z",
    uploaderName: "Rajesh Verma",
    uploaderRole: "STAFF",
    description: "CCTV security feed snippet covering Dining Hall Gate 2 corridor from 12:45 to 12:48 PM.",
    reviewStatus: "REVIEWED",
    reviewNotes: "Visual confirmation of 40-second dispute. No weapon or physical injury observable.",
    reviewedBy: "Dr. Alok Nath",
    reviewedAt: "2026-10-18T14:20:00Z",
    permittedRoles: ["SUPER_ADMIN", "DEAN", "COMMITTEE_MEMBER"],
    isConfidential: true,
    sha256Checksum: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    integrityVerifiedAt: "2026-10-18T14:20:00Z",
    custodyChain: [
      {
        id: "EACT-009",
        action: "Evidence Intake",
        actor: "Rajesh Verma (STAFF)",
        timestamp: "2026-10-18T10:30:00Z",
        details: "Security camera file extracted from campus DVR system."
      },
      {
        id: "EACT-010",
        action: "Access Restriction Configured",
        actor: "Prof. Ananya Sen (DEAN)",
        timestamp: "2026-10-18T11:00:00Z",
        details: "Restricted to Disciplinary Committee & Dean's Secretariat only."
      },
      {
        id: "EACT-011",
        action: "Marked as Reviewed",
        actor: "Dr. Alok Nath (COMMITTEE_MEMBER)",
        timestamp: "2026-10-18T14:20:00Z",
        details: "Video examined in committee review room."
      }
    ]
  },
  {
    id: "EV-06",
    fileId: "EV-06",
    caseId: "CX-2026-0104",
    caseNumber: "CX-2026-0104",
    name: "psychological_distress_report.pdf",
    size: "650 KB",
    sizeBytes: 665600,
    type: "application/pdf",
    typeCategory: "DOCUMENT",
    uploadedAt: "2026-10-19T14:00:00Z",
    uploaderName: "Pooja Nambiar",
    uploaderRole: "COORDINATOR",
    description: "Confidential student welfare and psychological counseling assessment notes.",
    reviewStatus: "REVIEWED",
    reviewNotes: "Strictly confidential medical/psychological record. Access restricted.",
    reviewedBy: "Prof. Ananya Sen",
    reviewedAt: "2026-10-20T09:30:00Z",
    permittedRoles: ["SUPER_ADMIN", "DEAN", "COORDINATOR"],
    isConfidential: true,
    sha256Checksum: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    integrityVerifiedAt: "2026-10-20T09:30:00Z",
    custodyChain: [
      {
        id: "EACT-012",
        action: "Confidential Clinical Intake",
        actor: "Pooja Nambiar (COORDINATOR)",
        timestamp: "2026-10-19T14:00:00Z",
        details: "Confidential counseling evaluation uploaded directly to sealed case."
      }
    ]
  }
];

export const INITIAL_COUNSELING_REFERRALS = [
  {
    id: "REF-2026-001",
    caseId: "CX-2026-0103",
    caseNumber: "CX-2026-0103",
    studentId: "STU-8824",
    studentName: "Tanmay Deshmukh",
    studentRoll: "23EE089",
    studentDepartment: "Electrical Engineering",
    reason: "Peer conflict de-escalation, impulse control, and emotional resilience mentoring.",
    referralDate: "2026-10-21T15:30:00Z",
    referredBy: "Dr. Alok Nath (Ethics Committee Lead)",
    priority: "HIGH",
    status: "ACTIVE", // ACTIVE, COMPLETED, CLOSED
    counselor: "Pooja Nambiar",
    sessionsCount: 1,
    followupDate: "2026-10-28",
    confidentialNotes: "Student expressed vulnerability regarding high academic parental expectations contributing to heightened irritability.",
    sessions: [
      {
        id: "CS-001",
        date: "2026-10-22",
        time: "14:30",
        venue: "Counseling Center, Suite B",
        counselor: "Pooja Nambiar",
        type: "Behavioral & Conflict Reflection",
        attendanceStatus: "ATTENDED", // SCHEDULED, ATTENDED, MISSED
        sessionStatus: "COMPLETED", // SCHEDULED, COMPLETED, FOLLOW_UP_REQUIRED, MISSED
        summary: "Established therapeutic rapport. Student reflected thoughtfully on alternative de-escalation strategies.",
        followupRequired: true,
        followupDate: "2026-10-28",
        conductedAt: "2026-10-22T15:30:00Z"
      }
    ],
    followups: [
      {
        id: "FW-001",
        date: "2026-10-28",
        objective: "Check stress coping mechanism adoption and review dining hall interaction comfort.",
        status: "PENDING", // PENDING, COMPLETED, RESCHEDULED
        outcome: ""
      }
    ]
  },
  {
    id: "REF-2026-002",
    caseId: "CX-2026-0101",
    caseNumber: "CX-2026-0101",
    studentId: "STU-8821",
    studentName: "Aarav Sharma",
    studentRoll: "22CSE041",
    studentDepartment: "Computer Science & Engineering",
    reason: "Examination anxiety counseling, academic integrity reflection, and study habits reinforcement.",
    referralDate: "2026-10-20T16:00:00Z",
    referredBy: "Prof. Ananya Sen (Dean of Student Affairs)",
    priority: "MEDIUM",
    status: "SCHEDULED",
    counselor: "Pooja Nambiar",
    sessionsCount: 1,
    followupDate: "2026-10-25",
    confidentialNotes: "Student has high GPA (8.9/10) but reported severe somatic panic attacks preceding semester final exams.",
    sessions: [
      {
        id: "CS-002",
        date: "2026-10-25",
        time: "11:00",
        venue: "Counseling Center, Suite A",
        counselor: "Pooja Nambiar",
        type: "Exam Stress & Academic Ethics",
        attendanceStatus: "SCHEDULED",
        sessionStatus: "SCHEDULED",
        summary: "Upcoming intake session scheduled with student agreement.",
        followupRequired: false,
        followupDate: null,
        conductedAt: null
      }
    ],
    followups: []
  },
  {
    id: "REF-2026-003",
    caseId: "CX-2026-0104",
    caseNumber: "CX-2026-0104",
    studentId: "STU-8822",
    studentName: "Rohan Varma",
    studentRoll: "23ME112",
    studentDepartment: "Mechanical Engineering",
    reason: "Severe academic stress, sleep disruption, and social withdrawal following laboratory incident.",
    referralDate: "2026-10-16T11:00:00Z",
    referredBy: "Dr. Alok Verma (Head Student Wellness Counselor)",
    priority: "HIGH",
    status: "ACTIVE",
    counselor: "Pooja Nambiar",
    sessionsCount: 2,
    followupDate: "2026-10-29",
    confidentialNotes: "Cognitive behavioral interventions initiated. Sleep hygiene schedule established with hostel warden cooperation.",
    sessions: [
      {
        id: "CS-003",
        date: "2026-10-18",
        time: "10:00",
        venue: "Counseling Center, Suite B",
        counselor: "Pooja Nambiar",
        type: "Intake & Clinical Evaluation",
        attendanceStatus: "ATTENDED",
        sessionStatus: "COMPLETED",
        summary: "Intake evaluation completed. Mild situational anxiety confirmed without clinical pathology.",
        followupRequired: true,
        followupDate: "2026-10-24",
        conductedAt: "2026-10-18T11:00:00Z"
      },
      {
        id: "CS-004",
        date: "2026-10-24",
        time: "15:00",
        venue: "Counseling Center, Suite B",
        counselor: "Pooja Nambiar",
        type: "Follow-up & Re-evaluation",
        attendanceStatus: "SCHEDULED",
        sessionStatus: "SCHEDULED",
        summary: "Scheduled session to review academic workload adjustment.",
        followupRequired: false,
        followupDate: null,
        conductedAt: null
      }
    ],
    followups: [
      {
        id: "FW-002",
        date: "2026-10-29",
        objective: "Monitor laboratory class re-entry and verify absence of peer friction.",
        status: "PENDING",
        outcome: ""
      }
    ]
  }
];
