package com.civnexa.dto;

import jakarta.validation.constraints.Size;

public class AccountDecisionRequest {

    @Size(max = 255, message = "Reason cannot exceed 255 characters")
    private String reason;

    public AccountDecisionRequest() {
    }

    public AccountDecisionRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
