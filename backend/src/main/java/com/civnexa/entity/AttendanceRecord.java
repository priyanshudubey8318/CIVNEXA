package com.civnexa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

@Entity
@Table(name = "attendance_records",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_session_student", columnNames = {"session_id", "student_id"})
        },
        indexes = {
                @Index(name = "idx_att_rec_session", columnList = "session_id"),
                @Index(name = "idx_att_rec_student", columnList = "student_id")
        }
)
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, foreignKey = @ForeignKey(name = "fk_att_rec_session"))
    private AttendanceSession session;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false, foreignKey = @ForeignKey(name = "fk_att_rec_student"))
    private User student;

    @NotNull
    @Column(name = "checked_in_at", nullable = false, updatable = false)
    private Instant checkedInAt = Instant.now();

    @NotBlank
    @Size(max = 30)
    @Column(name = "verification_method", nullable = false, length = 30)
    private String verificationMethod = "QR_SCAN";

    @NotBlank
    @Size(max = 64)
    @Column(name = "challenge_token", nullable = false, length = 64)
    private String challengeToken;

    public AttendanceRecord() {}

    public AttendanceRecord(AttendanceSession session, User student, String challengeToken, String verificationMethod) {
        this.session = session;
        this.student = student;
        this.challengeToken = challengeToken;
        this.verificationMethod = verificationMethod != null ? verificationMethod : "QR_SCAN";
        this.checkedInAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AttendanceSession getSession() { return session; }
    public void setSession(AttendanceSession session) { this.session = session; }

    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }

    public Instant getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(Instant checkedInAt) { this.checkedInAt = checkedInAt; }

    public String getVerificationMethod() { return verificationMethod; }
    public void setVerificationMethod(String verificationMethod) { this.verificationMethod = verificationMethod; }

    public String getChallengeToken() { return challengeToken; }
    public void setChallengeToken(String challengeToken) { this.challengeToken = challengeToken; }
}
