package com.civnexa.entity;

import com.civnexa.entity.enums.AttendanceStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "counseling_sessions", indexes = {
    @Index(name = "idx_csess_ref", columnList = "referral_id"),
    @Index(name = "idx_csess_date", columnList = "session_date")
})
public class CounselingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referral_id", nullable = false, foreignKey = @ForeignKey(name = "fk_csess_referral"))
    private CounselingReferral referral;

    @NotNull
    @Column(name = "session_number", nullable = false)
    private Integer sessionNumber;

    @NotNull
    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    private AttendanceStatus attendanceStatus = AttendanceStatus.SCHEDULED;

    @Column(name = "clinical_summary", columnDefinition = "TEXT")
    private String clinicalSummary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public CounselingSession() {
    }

    public CounselingSession(CounselingReferral referral, Integer sessionNumber, LocalDate sessionDate, AttendanceStatus attendanceStatus, String clinicalSummary) {
        this.referral = referral;
        this.sessionNumber = sessionNumber;
        this.sessionDate = sessionDate;
        this.attendanceStatus = attendanceStatus;
        this.clinicalSummary = clinicalSummary;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (attendanceStatus == null) attendanceStatus = AttendanceStatus.SCHEDULED;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CounselingReferral getReferral() {
        return referral;
    }

    public void setReferral(CounselingReferral referral) {
        this.referral = referral;
    }

    public Integer getSessionNumber() {
        return sessionNumber;
    }

    public void setSessionNumber(Integer sessionNumber) {
        this.sessionNumber = sessionNumber;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public AttendanceStatus getAttendanceStatus() {
        return attendanceStatus;
    }

    public void setAttendanceStatus(AttendanceStatus attendanceStatus) {
        this.attendanceStatus = attendanceStatus;
    }

    public String getClinicalSummary() {
        return clinicalSummary;
    }

    public void setClinicalSummary(String clinicalSummary) {
        this.clinicalSummary = clinicalSummary;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "CounselingSession{" +
                "id=" + id +
                ", sessionNumber=" + sessionNumber +
                ", sessionDate=" + sessionDate +
                ", attendanceStatus=" + attendanceStatus +
                '}';
    }
}
