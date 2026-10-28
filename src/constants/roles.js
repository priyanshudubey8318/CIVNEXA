// Centralized Institutional Roles Configuration for CIVNEXA
// Defines keys, display labels, visual badges, and descriptions for all 8 supported roles.

export const ROLES = {
  SUPER_ADMIN: {
    key: "SUPER_ADMIN",
    label: "Super Admin",
    badgeColor: "danger",
    description: "System governance, global audit, user permissions & platform policies",
  },
  DEAN: {
    key: "DEAN",
    label: "Dean / Central Admin",
    badgeColor: "info",
    description: "Institutional oversight, sensitive case escalations & appeals",
  },
  HOD: {
    key: "HOD",
    label: "Head of Department (HOD)",
    badgeColor: "primary",
    description: "Department conduct cases, verification queue & student 360",
  },
  FACULTY: {
    key: "FACULTY",
    label: "Faculty / Invigilator",
    badgeColor: "teal",
    description: "Incident reporting, exam hall logs & student search",
  },
  STAFF: {
    key: "STAFF",
    label: "Staff / Warden",
    badgeColor: "neutral",
    description: "Campus security, hostel discipline & facility incidents",
  },
  COORDINATOR: {
    key: "COORDINATOR",
    label: "Coordinator / Mentor",
    badgeColor: "success",
    description: "Student counseling calendar, welfare sessions & follow-ups",
  },
  COMMITTEE_MEMBER: {
    key: "COMMITTEE_MEMBER",
    label: "Committee Member",
    badgeColor: "confidential",
    description: "Proctorial board reviews, hearing hearings & evidence evaluation",
  },
  STUDENT: {
    key: "STUDENT",
    label: "Student",
    badgeColor: "warning",
    description: "Case explanations, grievances, counseling requests & appeals",
  },
};

export default ROLES;
