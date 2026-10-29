package com.civnexa.entity;

import com.civnexa.entity.enums.AttendanceStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "hearing_committee_members", indexes = {
    @Index(name = "idx_hcm_hearing", columnList = "hearing_id"),
    @Index(name = "idx_hcm_member", columnList = "member_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uq_hearing_member", columnNames = {"hearing_id", "member_id"})
})
public class HearingCommitteeMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hearing_id", nullable = false, foreignKey = @ForeignKey(name = "fk_hcm_hearing"))
    private Hearing hearing;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false, foreignKey = @ForeignKey(name = "fk_hcm_member"))
    private User member;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    private AttendanceStatus attendanceStatus = AttendanceStatus.PENDING;

    public HearingCommitteeMember() {
    }

    public HearingCommitteeMember(Hearing hearing, User member) {
        this.hearing = hearing;
        this.member = member;
        this.attendanceStatus = AttendanceStatus.PENDING;
    }

    public HearingCommitteeMember(Hearing hearing, User member, AttendanceStatus attendanceStatus) {
        this.hearing = hearing;
        this.member = member;
        this.attendanceStatus = attendanceStatus;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Hearing getHearing() {
        return hearing;
    }

    public void setHearing(Hearing hearing) {
        this.hearing = hearing;
    }

    public User getMember() {
        return member;
    }

    public void setMember(User member) {
        this.member = member;
    }

    public AttendanceStatus getAttendanceStatus() {
        return attendanceStatus;
    }

    public void setAttendanceStatus(AttendanceStatus attendanceStatus) {
        this.attendanceStatus = attendanceStatus;
    }

    @Override
    public String toString() {
        return "HearingCommitteeMember{" +
                "id=" + id +
                ", attendanceStatus=" + attendanceStatus +
                '}';
    }
}
