// Centralized Appellate Review Configuration for CIVNEXA (Phase FE-6)
// Defines institutional grounds for appeal and appellate lifecycle statuses.

export const APPEAL_GROUNDS = [
  {
    key: "PROCEDURAL_CONCERN",
    label: "Procedural Concern / Irregularity",
    description: "Failure to follow established university disciplinary procedure or failure to provide fair hearing.",
  },
  {
    key: "NEW_EVIDENCE",
    label: "New Supporting Evidence",
    description: "Material facts or documents that could not reasonably have been made available at the original hearing.",
  },
  {
    key: "FACTUAL_ERROR",
    label: "Factual Error / Identity Mistake",
    description: "Substantive mistake of fact, mistaken identity, or erroneous record in the investigation findings.",
  },
  {
    key: "PROPORTIONALITY",
    label: "Concern About Proportionality of Sanction",
    description: "The penalty or disciplinary measure imposed was manifestly excessive or disproportionate.",
  },
  {
    key: "OUTCOME_DISAGREEMENT",
    label: "Disagreement with Recorded Outcome",
    description: "Finding of responsibility is contested based on standard of proof or contradictory statements.",
  },
  {
    key: "OTHER_INSTITUTIONAL",
    label: "Other Institution-Configured Grounds",
    description: "Mitigating personal circumstances, health emergencies, or exceptional humanitarian factors.",
  },
];

export const APPEAL_STATUSES = [
  { key: "ALL", label: "All Statuses", badge: "secondary" },
  { key: "DRAFT", label: "Draft", badge: "secondary" },
  { key: "SUBMITTED", label: "Submitted", badge: "info" },
  { key: "UNDER_REVIEW", label: "Under Review", badge: "primary" },
  { key: "ADDITIONAL_INFORMATION_REQUESTED", label: "Info Requested", badge: "warning" },
  { key: "REVIEW_COMPLETED", label: "Review Completed", badge: "info" },
  { key: "UPHELD", label: "Original Decision Upheld", badge: "danger" },
  { key: "MODIFIED", label: "Sanction Modified", badge: "success" },
  { key: "REMANDED_FOR_REVIEW", label: "Remanded for Re-Hearing", badge: "warning" },
  { key: "WITHDRAWN", label: "Withdrawn", badge: "neutral" },
];

export default {
  APPEAL_GROUNDS,
  APPEAL_STATUSES,
};
