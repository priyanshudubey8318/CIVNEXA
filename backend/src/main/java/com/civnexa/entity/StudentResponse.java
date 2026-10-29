package com.civnexa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

@Entity
@Table(name = "student_responses", indexes = {
    @Index(name = "idx_resp_case", columnList = "case_id"),
    @Index(name = "idx_resp_student", columnList = "student_id")
})
public class StudentResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false, foreignKey = @ForeignKey(name = "fk_resp_case"))
    private CaseRecord caseRecord;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false, foreignKey = @ForeignKey(name = "fk_resp_student"))
    private User student;

    @NotBlank
    @Column(name = "response_text", nullable = false, columnDefinition = "TEXT")
    private String responseText;

    @Column(name = "declaration_confirmed", nullable = false)
    private boolean declarationConfirmed = false;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt = Instant.now();

    public StudentResponse() {
    }

    public StudentResponse(CaseRecord caseRecord, User student, String responseText, boolean declarationConfirmed) {
        this.caseRecord = caseRecord;
        this.student = student;
        this.responseText = responseText;
        this.declarationConfirmed = declarationConfirmed;
        this.submittedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (submittedAt == null) submittedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CaseRecord getCaseRecord() {
        return caseRecord;
    }

    public void setCaseRecord(CaseRecord caseRecord) {
        this.caseRecord = caseRecord;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    public boolean isDeclarationConfirmed() {
        return declarationConfirmed;
    }

    public void setDeclarationConfirmed(boolean declarationConfirmed) {
        this.declarationConfirmed = declarationConfirmed;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    @Override
    public String toString() {
        return "StudentResponse{" +
                "id=" + id +
                ", declarationConfirmed=" + declarationConfirmed +
                ", submittedAt=" + submittedAt +
                '}';
    }
}
