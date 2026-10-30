package com.civnexa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "case_activities", indexes = {
    @Index(name = "idx_act_case", columnList = "case_id"),
    @Index(name = "idx_act_timestamp", columnList = "timestamp")
})
public class CaseActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false, foreignKey = @ForeignKey(name = "fk_act_case"))
    private CaseRecord caseRecord;

    @NotBlank
    @Size(max = 100)
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", foreignKey = @ForeignKey(name = "fk_act_actor"))
    private User actor;

    @NotBlank
    @Size(max = 100)
    @Column(name = "actor_name", nullable = false, length = 100)
    private String actorName;

    @NotBlank
    @Size(max = 30)
    @Column(name = "actor_role", nullable = false, length = 30)
    private String actorRole;

    @Size(max = 50)
    @Column(name = "previous_status", length = 50)
    private String previousStatus;

    @Size(max = 50)
    @Column(name = "new_status", length = 50)
    private String newStatus;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp = Instant.now();

    public CaseActivity() {
    }

    public CaseActivity(CaseRecord caseRecord, String action, User actor, String actorName, String actorRole, String details) {
        this(caseRecord, action, actor, actorName, actorRole, null, null, details);
    }

    public CaseActivity(CaseRecord caseRecord, String action, User actor, String actorName, String actorRole, String previousStatus, String newStatus, String details) {
        this.caseRecord = caseRecord;
        this.action = action;
        this.actor = actor;
        this.actorName = actorName;
        this.actorRole = actorRole;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
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

    public CaseRecord getCaseRecord() {
        return caseRecord;
    }

    public void setCaseRecord(CaseRecord caseRecord) {
        this.caseRecord = caseRecord;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public User getActor() {
        return actor;
    }

    public void setActor(User actor) {
        this.actor = actor;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(String previousStatus) {
        this.previousStatus = previousStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public String getDetails() {
        return details;
    }

    public String getDescription() {
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
        return "CaseActivity{" +
                "id=" + id +
                ", action='" + action + '\'' +
                ", actorName='" + actorName + '\'' +
                ", actorRole='" + actorRole + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}
