package com.civnexa.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum Priority {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    @JsonCreator
    public static Priority fromString(String value) {
        if (value == null || value.isBlank()) {
            return MEDIUM;
        }
        String normalized = value.trim().toUpperCase();
        for (Priority p : values()) {
            if (p.name().equalsIgnoreCase(normalized)) {
                return p;
            }
        }
        if (normalized.contains("URGENT") || normalized.contains("SEVERE")) return CRITICAL;
        if (normalized.contains("HIGH")) return HIGH;
        if (normalized.contains("LOW")) return LOW;
        return MEDIUM;
    }
}
