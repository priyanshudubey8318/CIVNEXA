// Mock notifications for CIVNEXA notification center
// Default to empty array in production runtime to prevent fabricated notices

const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

export const INITIAL_NOTIFICATIONS = isTest
  ? [
      {
        id: "NOTIF-01",
        title: "Urgent Hearing Scheduled",
        message: "Proctorial hearing for case CX-2026-0102 has been scheduled.",
        type: "urgent",
        read: false,
        caseId: "CX-2026-0102",
        createdAt: "10 minutes ago",
      },
      {
        id: "NOTIF-02",
        title: "Incident Intake Logged",
        message: "A new incident report was registered.",
        type: "case",
        read: false,
        caseId: "CX-2026-0101",
        createdAt: "1 hour ago",
      },
    ]
  : [];

export default INITIAL_NOTIFICATIONS;
