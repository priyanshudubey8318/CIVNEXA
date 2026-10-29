package com.civnexa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "evidence_custody_logs", indexes = {
    @Index(name = "idx_custody_ev", columnList = "evidence_id"),
    @Index(name = "idx_custody_time", columnList = "timestamp")
})
public class EvidenceCustodyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evidence_id", nullable = false, foreignKey = @ForeignKey(name = "fk_custody_evidence"))
    private EvidenceItem evidenceItem;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false, foreignKey = @ForeignKey(name = "fk_custody_actor"))
    private User actor;

    @NotBlank
    @Size(max = 100)
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp = Instant.now();

    public EvidenceCustodyLog() {
    }

    public EvidenceCustodyLog(EvidenceItem evidenceItem, User actor, String action, String details) {
        this.evidenceItem = evidenceItem;
        this.actor = actor;
        this.action = action;
        this.details = details;
        this.timestamp = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (timestamp == null) timestamp = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public EvidenceItem getEvidenceItem() {
        return evidenceItem;
    }

    public void setEvidenceItem(EvidenceItem evidenceItem) {
        this.evidenceItem = evidenceItem;
    }

    public User getActor() {
        return actor;
    }

    public void setActor(User actor) {
        this.actor = actor;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "EvidenceCustodyLog{" +
                "id=" + id +
                ", action='" + action + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}
