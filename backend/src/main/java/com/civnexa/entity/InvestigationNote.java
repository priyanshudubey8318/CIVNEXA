package com.civnexa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

@Entity
@Table(name = "case_investigation_notes", indexes = {
    @Index(name = "idx_note_case", columnList = "case_id"),
    @Index(name = "idx_note_author", columnList = "author_id")
})
public class InvestigationNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false, foreignKey = @ForeignKey(name = "fk_note_case"))
    private CaseRecord caseRecord;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false, foreignKey = @ForeignKey(name = "fk_note_author"))
    private User author;

    @NotBlank
    @Column(name = "note", nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(name = "is_confidential", nullable = false)
    private boolean isConfidential = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public InvestigationNote() {
    }

    public InvestigationNote(CaseRecord caseRecord, User author, String note, boolean isConfidential) {
        this.caseRecord = caseRecord;
        this.author = author;
        this.note = note;
        this.isConfidential = isConfidential;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
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

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public boolean isConfidential() {
        return isConfidential;
    }

    public void setConfidential(boolean confidential) {
        isConfidential = confidential;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "InvestigationNote{" +
                "id=" + id +
                ", isConfidential=" + isConfidential +
                ", createdAt=" + createdAt +
                '}';
    }
}
