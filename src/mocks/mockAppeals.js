// Mock dataset for CIVNEXA Phase FE-6: Appellate Review & Dispute Reconsideration
// Provides realistic student appeal records, procedural grounds, reviewer assignments, and chronological timelines.

export { APPEAL_GROUNDS, APPEAL_STATUSES } from '../constants/appealConfig.js';

export const INITIAL_MOCK_APPEALS = [
  {
    id: "APL-2026-001",
    appealNumber: "APL-2026-001",
    caseId: "CX-2026-0105",
    caseNumber: "CX-2026-0105",
    caseTitle: "Hostel curfew violation and unauthorized guest accommodated overnight",
    appellant: {
      id: "STU-8821",
      name: "Aarav Sharma",
      rollNo: "22CSE041",
      email: "aarav.sharma@civnexa.edu",
      department: "Computer Science & Engineering",
      departmentCode: "CSE",
    },
    originalDecision: {
      decisionDate: "2026-10-15T16:30:00Z",
      decisionSummary: "Formal residential reprimand, levy of ₹1,000 unauthorized guest surcharge, and endorsement in hostel conduct file.",
      sanctionType: "REPRIMAND_AND_FINE",
      decidedBy: "Rajesh Verma (Chief Residential Warden)",
      decisionPreserved: true,
    },
    appealDeadline: "2026-10-29T23:59:59Z",
    submittedAt: "2026-10-17T11:00:00Z",
    updatedAt: "2026-10-20T15:30:00Z",
    status: "UNDER_REVIEW",
    statusLabel: "Under Review",
    grounds: [
      "PROPORTIONALITY",
      "NEW_EVIDENCE"
    ],
    groundsSummary: "Proportionality of Sanction & New Supporting Evidence",
    explanation: "The overnight guest was an official inter-college hackathon participant whose outbound night train was cancelled due to regional signal failure. The guest presented university credentials at hostel gate reception at 00:15, but the night security assistant did not process the emergency visitor slip. Imposing a formal disciplinary record is disproportionate given documented transport disruption.",
    reliefSought: "Removal of formal disciplinary endorsement from academic record and substitution with an administrative reminder.",
    supportingDocuments: [
      {
        id: "DOC-APL-01",
        name: "railway_cancellation_bulletin_oct10.pdf",
        size: "340 KB",
        type: "application/pdf",
        uploadedAt: "2026-10-17T10:45:00Z",
      },
      {
        id: "DOC-APL-02",
        name: "hackathon_delegation_letter.pdf",
        size: "180 KB",
        type: "application/pdf",
        uploadedAt: "2026-10-17T10:50:00Z",
      }
    ],
    declarationConfirmed: true,
    assignedReviewer: {
      id: "USR-002",
      name: "Prof. Ananya Sen",
      role: "DEAN",
      title: "Dean of Student Affairs",
      assignedAt: "2026-10-18T09:30:00Z",
    },
    reviewerNotes: [
      {
        id: "APN-01",
        author: "Prof. Ananya Sen",
        role: "DEAN",
        timestamp: "2026-10-19T14:15:00Z",
        text: "Rail disruption confirmed via public transport bulletin. Requesting verification of guest reception log from security supervisor.",
      }
    ],
    additionalInfoRequests: [],
    recommendation: null,
    finalOutcome: null,
    timeline: [
      {
        id: "AP-TL-01",
        event: "APPEAL_SUBMITTED",
        title: "Appellate Petition Lodged",
        actor: "Aarav Sharma (Appellant)",
        role: "STUDENT",
        timestamp: "2026-10-17T11:00:00Z",
        previousStatus: "DRAFT",
        newStatus: "SUBMITTED",
        explanation: "Formal appeal petition submitted challenging sanction proportionality with 2 supporting exhibits.",
      },
      {
        id: "AP-TL-02",
        event: "REVIEWER_ASSIGNED",
        title: "Appellate Reviewer Assigned",
        actor: "System Registry",
        role: "SYSTEM",
        timestamp: "2026-10-18T09:30:00Z",
        previousStatus: "SUBMITTED",
        newStatus: "UNDER_REVIEW",
        explanation: "Assigned to Prof. Ananya Sen (Dean of Student Affairs) for independent appellate assessment.",
      },
      {
        id: "AP-TL-03",
        event: "REVIEW_COMMENCED",
        title: "Preliminary Docket Inspection",
        actor: "Prof. Ananya Sen",
        role: "DEAN",
        timestamp: "2026-10-19T14:15:00Z",
        previousStatus: "UNDER_REVIEW",
        newStatus: "UNDER_REVIEW",
        explanation: "Primary docket, original warden minutes, and railway cancellation exhibits evaluated.",
      }
    ],
  },
  {
    id: "APL-2026-002",
    appealNumber: "APL-2026-002",
    caseId: "CX-2026-0103",
    caseNumber: "CX-2026-0103",
    caseTitle: "Physical altercation and verbal abuse outside Main Dining Hall",
    appellant: {
      id: "STU-6340",
      name: "Tanmay Deshmukh",
      rollNo: "22ECE088",
      email: "tanmay.d@civnexa.edu",
      department: "Electronics & Communication",
      departmentCode: "ECE",
    },
    originalDecision: {
      decisionDate: "2026-10-21T15:30:00Z",
      decisionSummary: "Mandatory anger-management counseling (3 sessions) and 10 hours library community service.",
      sanctionType: "COUNSELING_AND_SERVICE",
      decidedBy: "Dr. Alok Nath (Ethics Committee Lead)",
      decisionPreserved: true,
    },
    appealDeadline: "2026-11-04T23:59:59Z",
    submittedAt: "2026-10-21T16:30:00Z",
    updatedAt: "2026-10-22T10:00:00Z",
    status: "ADDITIONAL_INFORMATION_REQUESTED",
    statusLabel: "Info Requested",
    grounds: [
      "PROCEDURAL_CONCERN",
      "NEW_EVIDENCE"
    ],
    groundsSummary: "Procedural Concern & Witness Corroboration",
    explanation: "The Ethics Committee deliberation notes did not take into account that faculty witness Dr. Meera Rao had provided an on-the-spot de-escalation account confirming that appellant acted purely in self-defense after unprovoked shove.",
    reliefSought: "Full exoneration or waiver of compulsory community service requirement.",
    supportingDocuments: [],
    declarationConfirmed: true,
    assignedReviewer: {
      id: "USR-001",
      name: "Dr. Vikram Seth",
      role: "SUPER_ADMIN",
      title: "Vice Chancellor / Super Admin",
      assignedAt: "2026-10-21T17:00:00Z",
    },
    reviewerNotes: [
      {
        id: "APN-02",
        author: "Dr. Vikram Seth",
        role: "SUPER_ADMIN",
        timestamp: "2026-10-22T09:45:00Z",
        text: "Faculty proctor Dr. Meera Rao's written summary was absent from the initial committee packet.",
      }
    ],
    additionalInfoRequests: [
      {
        id: "REQ-01",
        query: "Please submit written confirmation or email statement from Dr. Meera Rao endorsing your self-defense account.",
        requestedBy: "Dr. Vikram Seth",
        requestedAt: "2026-10-22T10:00:00Z",
        deadline: "2026-10-27T17:00:00Z",
        status: "PENDING_STUDENT_SUBMISSION",
      }
    ],
    recommendation: null,
    finalOutcome: null,
    timeline: [
      {
        id: "AP-TL-04",
        event: "APPEAL_SUBMITTED",
        title: "Appellate Petition Lodged",
        actor: "Tanmay Deshmukh (Appellant)",
        role: "STUDENT",
        timestamp: "2026-10-21T16:30:00Z",
        previousStatus: "DRAFT",
        newStatus: "SUBMITTED",
        explanation: "Appellate review requested citing omission of faculty proctor witness statement.",
      },
      {
        id: "AP-TL-05",
        event: "REVIEWER_ASSIGNED",
        title: "Independent Reviewer Assigned",
        actor: "System Registry",
        role: "SYSTEM",
        timestamp: "2026-10-21T17:00:00Z",
        previousStatus: "SUBMITTED",
        newStatus: "UNDER_REVIEW",
        explanation: "Assigned to Dr. Vikram Seth for ombudsman assessment.",
      },
      {
        id: "AP-TL-06",
        event: "ADDITIONAL_INFO_REQUESTED",
        title: "Supplementary Witness Statement Requested",
        actor: "Dr. Vikram Seth",
        role: "SUPER_ADMIN",
        timestamp: "2026-10-22T10:00:00Z",
        previousStatus: "UNDER_REVIEW",
        newStatus: "ADDITIONAL_INFORMATION_REQUESTED",
        explanation: "Appellant requested to furnish written statement from faculty bystander Dr. Meera Rao.",
      }
    ],
  }
];
