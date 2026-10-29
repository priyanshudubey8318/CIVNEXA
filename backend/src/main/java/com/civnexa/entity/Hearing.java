package com.civnexa.entity;

import com.civnexa.entity.enums.HearingMode;
import com.civnexa.entity.enums.HearingStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "hearings", indexes = {
    @Index(name = "idx_hearing_num", columnList = "hearing_number", unique = true),
    @Index(name = "idx_hearing_case", columnList = "case_id"),
    @Index(name = "idx_hearing_date", columnList = "hearing_date"),
    @Index(name = "idx_hearing_venue", columnList = "venue")
})
public class Hearing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 30)
    @Column(name = "hearing_number", nullable = false, unique = true, length = 30)
    private String hearingNumber;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false, foreignKey = @ForeignKey(name = "fk_hearing_case"))
    private CaseRecord caseRecord;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduled_by_id", nullable = false, foreignKey = @ForeignKey(name = "fk_hearing_scheduler"))
    private User scheduledBy;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "presiding_authority_id", nullable = false, foreignKey = @ForeignKey(name = "fk_hearing_presiding"))
    private User presidingAuthority;

    @NotNull
    @Column(name = "hearing_date", nullable = false)
    private LocalDate hearingDate;

    @NotNull
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @NotNull
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @NotBlank
    @Size(max = 150)
    @Column(name = "venue", nullable = false, length = 150)
    private String venue;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "mode", nullable = false, length = 30)
    private HearingMode mode = HearingMode.IN_PERSON;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private HearingStatus status = HearingStatus.SCHEDULED;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "outcome", columnDefinition = "TEXT")
    private String outcome;

    @Column(name = "minutes_draft", columnDefinition = "TEXT")
    private String minutesDraft;

    @Column(name = "minutes_finalized_at")
    private Instant minutesFinalizedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Hearing() {
    }

    public Hearing(String hearingNumber, CaseRecord caseRecord, User scheduledBy, User presidingAuthority, LocalDate hearingDate, LocalTime startTime, LocalTime endTime, String venue) {
        this.hearingNumber = hearingNumber;
        this.caseRecord = caseRecord;
        this.scheduledBy = scheduledBy;
        this.presidingAuthority = presidingAuthority;
        this.hearingDate = hearingDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.venue = venue;
        this.mode = HearingMode.IN_PERSON;
        this.status = HearingStatus.SCHEDULED;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (status == null) status = HearingStatus.SCHEDULED;
        if (mode == null) mode = HearingMode.IN_PERSON;
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

    public String getHearingNumber() {
        return hearingNumber;
    }

    public void setHearingNumber(String hearingNumber) {
        this.hearingNumber = hearingNumber;
    }

    public CaseRecord getCaseRecord() {
        return caseRecord;
    }

    public void setCaseRecord(CaseRecord caseRecord) {
        this.caseRecord = caseRecord;
    }

    public User getScheduledBy() {
        return scheduledBy;
    }

    public void setScheduledBy(User scheduledBy) {
        this.scheduledBy = scheduledBy;
    }

    public User getPresidingAuthority() {
        return presidingAuthority;
    }

    public void setPresidingAuthority(User presidingAuthority) {
        this.presidingAuthority = presidingAuthority;
    }

    public LocalDate getHearingDate() {
        return hearingDate;
    }

    public void setHearingDate(LocalDate hearingDate) {
        this.hearingDate = hearingDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public HearingMode getMode() {
        return mode;
    }

    public void setMode(HearingMode mode) {
        this.mode = mode;
    }

    public HearingStatus getStatus() {
        return status;
    }

    public void setStatus(HearingStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getOutcome() {
        return outcome;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public String getMinutesDraft() {
        return minutesDraft;
    }

    public void setMinutesDraft(String minutesDraft) {
        this.minutesDraft = minutesDraft;
    }

    public Instant getMinutesFinalizedAt() {
        return minutesFinalizedAt;
    }

    public void setMinutesFinalizedAt(Instant minutesFinalizedAt) {
        this.minutesFinalizedAt = minutesFinalizedAt;
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
        return "Hearing{" +
                "id=" + id +
                ", hearingNumber='" + hearingNumber + '\'' +
                ", hearingDate=" + hearingDate +
                ", startTime=" + startTime +
                ", venue='" + venue + '\'' +
                ", status=" + status +
                '}';
    }
}
