package com.civnexa.entity;

import com.civnexa.entity.enums.AppealStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "appeals", indexes = {
    @Index(name = "idx_appeal_num", columnList = "appeal_number", unique = true),
    @Index(name = "idx_appeal_case", columnList = "case_id"),
    @Index(name = "idx_appeal_appellant", columnList = "appellant_id"),
    @Index(name = "idx_appeal_status", columnList = "status")
})
public class AppealRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 30)
    @Column(name = "appeal_number", nullable = false, unique = true, length = 30)
    private String appealNumber;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false, foreignKey = @ForeignKey(name = "fk_appeal_case"))
    private CaseRecord caseRecord;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appellant_id", nullable = false, foreignKey = @ForeignKey(name = "fk_appeal_appellant"))
    private User appellant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_reviewer_id", foreignKey = @ForeignKey(name = "fk_appeal_reviewer"))
    private User assignedReviewer;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private AppealStatus status = AppealStatus.SUBMITTED;

    @NotBlank
    @Size(max = 255)
    @Column(name = "grounds", nullable = false, length = 255)
    private String grounds;

    @NotBlank
    @Column(name = "explanation", nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @NotBlank
    @Column(name = "relief_sought", nullable = false, columnDefinition = "TEXT")
    private String reliefSought;

    @NotBlank
    @Column(name = "original_decision_summary", nullable = false, columnDefinition = "TEXT")
    private String originalDecisionSummary;

    @Column(name = "original_decision_date")
    private Instant originalDecisionDate;

    @Size(max = 50)
    @Column(name = "original_sanction_type", length = 50)
    private String originalSanctionType;

    @NotNull
    @Column(name = "appeal_deadline", nullable = false)
    private Instant appealDeadline;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt = Instant.now();

    @Column(name = "recommendation", columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "final_outcome", columnDefinition = "TEXT")
    private String finalOutcome;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decided_by_id", foreignKey = @ForeignKey(name = "fk_appeal_decider"))
    private User decidedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public AppealRecord() {
    }

    public AppealRecord(String appealNumber, CaseRecord caseRecord, User appellant, String grounds, String explanation, String reliefSought, String originalDecisionSummary, Instant appealDeadline) {
        this.appealNumber = appealNumber;
        this.caseRecord = caseRecord;
        this.appellant = appellant;
        this.grounds = grounds;
        this.explanation = explanation;
        this.reliefSought = reliefSought;
        this.originalDecisionSummary = originalDecisionSummary;
        this.appealDeadline = appealDeadline;
        this.status = AppealStatus.SUBMITTED;
        this.submittedAt = Instant.now();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (submittedAt == null) submittedAt = Instant.now();
        if (status == null) status = AppealStatus.SUBMITTED;
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAppealNumber() {
        return appealNumber;
    }

    public void setAppealNumber(String appealNumber) {
        this.appealNumber = appealNumber;
    }

    public CaseRecord getCaseRecord() {
        return caseRecord;
    }

    public void setCaseRecord(CaseRecord caseRecord) {
        this.caseRecord = caseRecord;
    }

    public User getAppellant() {
        return appellant;
    }

    public void setAppellant(User appellant) {
        this.appellant = appellant;
    }

    public User getAssignedReviewer() {
        return assignedReviewer;
    }

    public void setAssignedReviewer(User assignedReviewer) {
        this.assignedReviewer = assignedReviewer;
    }

    public AppealStatus getStatus() {
        return status;
    }

    public void setStatus(AppealStatus status) {
        this.status = status;
    }

    public String getGrounds() {
        return grounds;
    }

    public void setGrounds(String grounds) {
        this.grounds = grounds;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public String getReliefSought() {
        return reliefSought;
    }

    public void setReliefSought(String reliefSought) {
        this.reliefSought = reliefSought;
    }

    public String getOriginalDecisionSummary() {
        return originalDecisionSummary;
    }

    public void setOriginalDecisionSummary(String originalDecisionSummary) {
        this.originalDecisionSummary = originalDecisionSummary;
    }

    public Instant getOriginalDecisionDate() {
        return originalDecisionDate;
    }

    public void setOriginalDecisionDate(Instant originalDecisionDate) {
        this.originalDecisionDate = originalDecisionDate;
    }

    public String getOriginalSanctionType() {
        return originalSanctionType;
    }

    public void setOriginalSanctionType(String originalSanctionType) {
        this.originalSanctionType = originalSanctionType;
    }

    public Instant getAppealDeadline() {
        return appealDeadline;
    }

    public void setAppealDeadline(Instant appealDeadline) {
        this.appealDeadline = appealDeadline;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public String getFinalOutcome() {
        return finalOutcome;
    }

    public void setFinalOutcome(String finalOutcome) {
        this.finalOutcome = finalOutcome;
    }

    public Instant getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(Instant decidedAt) {
        this.decidedAt = decidedAt;
    }

    public User getDecidedBy() {
        return decidedBy;
    }

    public void setDecidedBy(User decidedBy) {
        this.decidedBy = decidedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "AppealRecord{" +
                "id=" + id +
                ", appealNumber='" + appealNumber + '\'' +
                ", status=" + status +
                ", grounds='" + grounds + '\'' +
                ", submittedAt=" + submittedAt +
                '}';
    }
}
