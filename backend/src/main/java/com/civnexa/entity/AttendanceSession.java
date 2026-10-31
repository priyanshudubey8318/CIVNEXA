package com.civnexa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "attendance_sessions", indexes = {
        @Index(name = "idx_att_sess_code", columnList = "session_code", unique = true)
})
public class AttendanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "session_code", nullable = false, unique = true, length = 50)
    private String sessionCode;

    @NotBlank
    @Size(max = 150)
    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @NotBlank
    @Size(max = 50)
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", foreignKey = @ForeignKey(name = "fk_att_sess_case"))
    private CaseRecord caseRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hearing_id", foreignKey = @ForeignKey(name = "fk_att_sess_hearing"))
    private Hearing hearing;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false, foreignKey = @ForeignKey(name = "fk_att_sess_creator"))
    private User creator;

    @NotBlank
    @Size(max = 64)
    @Column(name = "active_challenge", nullable = false, length = 64)
    private String activeChallenge;

    @NotNull
    @Column(name = "challenge_expires_at", nullable = false)
    private Instant challengeExpiresAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttendanceRecord> records = new ArrayList<>();

    public AttendanceSession() {}

    public AttendanceSession(String sessionCode, String title, String eventType, User creator, String initialChallenge, Instant challengeExpiresAt) {
        this.sessionCode = sessionCode;
        this.title = title;
        this.eventType = eventType;
        this.creator = creator;
        this.activeChallenge = initialChallenge;
        this.challengeExpiresAt = challengeExpiresAt;
        this.isActive = true;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSessionCode() { return sessionCode; }
    public void setSessionCode(String sessionCode) { this.sessionCode = sessionCode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public CaseRecord getCaseRecord() { return caseRecord; }
    public void setCaseRecord(CaseRecord caseRecord) { this.caseRecord = caseRecord; }

    public Hearing getHearing() { return hearing; }
    public void setHearing(Hearing hearing) { this.hearing = hearing; }

    public User getCreator() { return creator; }
    public void setCreator(User creator) { this.creator = creator; }

    public String getActiveChallenge() { return activeChallenge; }
    public void setActiveChallenge(String activeChallenge) { this.activeChallenge = activeChallenge; }

    public Instant getChallengeExpiresAt() { return challengeExpiresAt; }
    public void setChallengeExpiresAt(Instant challengeExpiresAt) { this.challengeExpiresAt = challengeExpiresAt; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<AttendanceRecord> getRecords() { return records; }
    public void setRecords(List<AttendanceRecord> records) { this.records = records; }
}
