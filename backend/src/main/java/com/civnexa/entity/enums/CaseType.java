package com.civnexa.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum CaseType {
    INCIDENT,
    GRIEVANCE;

    @JsonCreator
    public static CaseType fromString(String value) {
        if (value == null || value.isBlank()) {
            return INCIDENT;
        }
        String normalized = value.trim().toUpperCase();
        for (CaseType ct : values()) {
            if (ct.name().equalsIgnoreCase(normalized)) {
                return ct;
            }
        }
        if (normalized.contains("GRIEV") || normalized.contains("COMPLAINT")) return GRIEVANCE;
        return INCIDENT;
    }
}
