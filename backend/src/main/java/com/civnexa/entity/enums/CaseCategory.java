package com.civnexa.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum CaseCategory {
    EXAM_INCIDENT,
    CAMPUS_SAFETY,
    ANTI_RAGGING,
    ACADEMIC_GRIEVANCE,
    DISCIPLINE,
    HOSTEL_ISSUE,
    FACULTY_GRIEVANCE,
    INFRASTRUCTURE,
    OTHER;

    @JsonCreator
    public static CaseCategory fromString(String value) {
        if (value == null || value.isBlank()) {
            return OTHER;
        }
        String normalized = value.trim().toUpperCase().replace(" ", "_").replace("&", "").replace("-", "_");
        for (CaseCategory cat : values()) {
            if (cat.name().equalsIgnoreCase(normalized)) {
                return cat;
            }
        }
        if (normalized.contains("EXAM") || normalized.contains("MALPRACTICE")) return EXAM_INCIDENT;
        if (normalized.contains("SAFETY") || normalized.contains("SECURITY")) return CAMPUS_SAFETY;
        if (normalized.contains("RAG") || normalized.contains("BULLY")) return ANTI_RAGGING;
        if (normalized.contains("ACADEMIC") || normalized.contains("GRADE") || normalized.contains("GRIEVANCE")) return ACADEMIC_GRIEVANCE;
        if (normalized.contains("DISCIPLIN") || normalized.contains("MISCONDUCT") || normalized.contains("BEHAVIOR")) return DISCIPLINE;
        if (normalized.contains("HOSTEL") || normalized.contains("MESS")) return HOSTEL_ISSUE;
        if (normalized.contains("FACULTY") || normalized.contains("TEACH")) return FACULTY_GRIEVANCE;
        if (normalized.contains("INFRA") || normalized.contains("FACILIT") || normalized.contains("MAINT")) return INFRASTRUCTURE;
        return OTHER;
    }
}
