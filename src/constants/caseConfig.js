// Centralized Case Configuration for CIVNEXA
// Defines institutional case categories, subcategories, anonymity permissions, and workflow statuses.

export const CASE_CATEGORIES = [
  { key: "ALL", label: "All Categories", allowsAnonymous: false },
  {
    key: "EXAM_INCIDENT",
    label: "Examination Incident",
    allowsAnonymous: false,
    subcategories: ["Unauthorized Electronic Device", "Plagiarism in Answer Script", "Impersonation", "Disruptive Behavior in Exam Hall", "Possession of Unauthorized Notes"],
  },
  {
    key: "CAMPUS_SAFETY",
    label: "Campus Safety & Harassment",
    allowsAnonymous: true,
    subcategories: ["Verbal Harassment / Bullying", "Physical Altercation", "Cyberbullying / Online Harassment", "Stalking", "Hostile Environment Complaint"],
  },
  {
    key: "ANTI_RAGGING",
    label: "Anti-Ragging (Strict Protocol)",
    allowsAnonymous: true,
    subcategories: ["Hostel Ragging Incident", "Senior Coercion / Humiliation", "Online / Group Ragging", "Fresher Intimidation"],
  },
  {
    key: "ACADEMIC_GRIEVANCE",
    label: "Academic Grievance",
    allowsAnonymous: false,
    subcategories: ["Grading / Evaluation Discrepancy", "Attendance Shortage Appeal", "Course Syllabus Incompletion", "Laboratory Access Grievance", "Exam Schedule Clash"],
  },
  {
    key: "DISCIPLINE",
    label: "Discipline & Misconduct",
    allowsAnonymous: false,
    subcategories: ["Property Damage / Vandalism", "Unauthorized Absence / Bunking", "Classroom Misconduct", "Substance Abuse on Campus", "Insubordination"],
  },
  {
    key: "HOSTEL_ISSUE",
    label: "Hostel & Residence",
    allowsAnonymous: false,
    subcategories: ["Curfew Violation", "Unauthorized Overnight Guest", "Roommate Conflict", "Mess / Dining Facility Grievance", "Hostel Property Damage"],
  },
  {
    key: "FACULTY_GRIEVANCE",
    label: "Faculty/Staff Complaint",
    allowsAnonymous: true,
    subcategories: ["Unprofessional Conduct", "Evaluation Bias / Lack of Transparency", "Arbitrary Attendance Deduction", "Unavailability for Mentorship"],
  },
  {
    key: "INFRASTRUCTURE",
    label: "Infrastructure Complaint",
    allowsAnonymous: false,
    subcategories: ["Lab Equipment Breakdown", "Classroom Projector / AC Failure", "Sanitation / Water Issue", "Library Facilities"],
  },
  {
    key: "OTHER",
    label: "Other Institutional Matter",
    allowsAnonymous: false,
    subcategories: ["General Campus Concern", "Transport Facility", "Sports Complex Issue"],
  },
];

export const CASE_STATUSES = [
  { key: "ALL", label: "All Statuses", badge: "secondary" },
  { key: "SUBMITTED", label: "Submitted", badge: "info" },
  { key: "PENDING_VERIFICATION", label: "Pending Verification", badge: "warning" },
  { key: "VERIFIED", label: "Verified", badge: "primary" },
  { key: "ASSIGNED", label: "Assigned", badge: "primary" },
  { key: "UNDER_INVESTIGATION", label: "Under Investigation", badge: "info" },
  { key: "AWAITING_RESPONSE", label: "Awaiting Student Response", badge: "warning" },
  { key: "HEARING_SCHEDULED", label: "Hearing Scheduled", badge: "primary" },
  { key: "DECISION_PENDING", label: "Decision Pending", badge: "warning" },
  { key: "RESOLVED", label: "Resolved", badge: "success" },
  { key: "CLOSED", label: "Closed", badge: "neutral" },
  { key: "RETURNED_FOR_INFORMATION", label: "Returned for Info", badge: "warning" },
  { key: "REJECTED", label: "Rejected", badge: "danger" },
  { key: "ESCALATED", label: "Escalated", badge: "danger" },
];

export default {
  CASE_CATEGORIES,
  CASE_STATUSES,
};
