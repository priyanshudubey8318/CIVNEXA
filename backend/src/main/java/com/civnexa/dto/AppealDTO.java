package com.civnexa.dto;

import com.civnexa.entity.AppealRecord;
import com.civnexa.entity.enums.AppealStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class AppealDTO {

    public static class SubmitRequest {
        @NotNull
        private Long caseId;

        @NotBlank
        private String grounds;

        @NotBlank
        private String explanation;

        @NotBlank
        private String reliefSought;

        public Long getCaseId() { return caseId; }
        public void setCaseId(Long caseId) { this.caseId = caseId; }
        public String getGrounds() { return grounds; }
        public void setGrounds(String grounds) { this.grounds = grounds; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
        public String getReliefSought() { return reliefSought; }
        public void setReliefSought(String reliefSought) { this.reliefSought = reliefSought; }
    }

    public static class ReviewRequest {
        @NotNull
        private AppealStatus status;

        @NotBlank
        private String finalOutcome;

        private String recommendation;

        public AppealStatus getStatus() { return status; }
        public void setStatus(AppealStatus status) { this.status = status; }
        public String getFinalOutcome() { return finalOutcome; }
        public void setFinalOutcome(String finalOutcome) { this.finalOutcome = finalOutcome; }
        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    }

    public static class Response {
        private Long id;
        private String appealNumber;
        private Long caseId;
        private String caseNumber;
        private String caseTitle;
        private String appellantName;
        private String reviewerName;
        private AppealStatus status;
        private String grounds;
        private String explanation;
        private String reliefSought;
        private String finalOutcome;
        private String recommendation;
        private Instant decidedAt;
        private Instant submittedAt;

        public static Response fromEntity(AppealRecord record) {
            Response dto = new Response();
            dto.setId(record.getId());
            dto.setAppealNumber(record.getAppealNumber());
            if (record.getCaseRecord() != null) {
                dto.setCaseId(record.getCaseRecord().getId());
                dto.setCaseNumber(record.getCaseRecord().getCaseNumber());
                dto.setCaseTitle(record.getCaseRecord().getTitle());
            }
            if (record.getAppellant() != null) {
                dto.setAppellantName(record.getAppellant().getName());
            }
            if (record.getAssignedReviewer() != null) {
                dto.setReviewerName(record.getAssignedReviewer().getName());
            } else if (record.getDecidedBy() != null) {
                dto.setReviewerName(record.getDecidedBy().getName());
            }
            dto.setStatus(record.getStatus());
            dto.setGrounds(record.getGrounds());
            dto.setExplanation(record.getExplanation());
            dto.setReliefSought(record.getReliefSought());
            dto.setFinalOutcome(record.getFinalOutcome());
            dto.setRecommendation(record.getRecommendation());
            dto.setDecidedAt(record.getDecidedAt());
            dto.setSubmittedAt(record.getSubmittedAt());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getAppealNumber() { return appealNumber; }
        public void setAppealNumber(String appealNumber) { this.appealNumber = appealNumber; }
        public Long getCaseId() { return caseId; }
        public void setCaseId(Long caseId) { this.caseId = caseId; }
        public String getCaseNumber() { return caseNumber; }
        public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
        public String getCaseTitle() { return caseTitle; }
        public void setCaseTitle(String caseTitle) { this.caseTitle = caseTitle; }
        public String getAppellantName() { return appellantName; }
        public void setAppellantName(String appellantName) { this.appellantName = appellantName; }
        public String getReviewerName() { return reviewerName; }
        public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
        public AppealStatus getStatus() { return status; }
        public void setStatus(AppealStatus status) { this.status = status; }
        public String getGrounds() { return grounds; }
        public void setGrounds(String grounds) { this.grounds = grounds; }
        public String getExplanation() { return explanation; }
        public void setExplanation(String explanation) { this.explanation = explanation; }
        public String getReliefSought() { return reliefSought; }
        public void setReliefSought(String reliefSought) { this.reliefSought = reliefSought; }
        public String getFinalOutcome() { return finalOutcome; }
        public void setFinalOutcome(String finalOutcome) { this.finalOutcome = finalOutcome; }
        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
        public Instant getDecidedAt() { return decidedAt; }
        public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
        public Instant getSubmittedAt() { return submittedAt; }
        public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    }
}
