package com.civnexa.dto;

import com.civnexa.entity.CounselingReferral;
import com.civnexa.entity.CounselingSession;
import com.civnexa.entity.enums.AttendanceStatus;
import com.civnexa.entity.enums.Priority;
import com.civnexa.entity.enums.ReferralStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class CounselingDTO {

    public static class CreateReferralRequest {
        @NotNull
        private Long studentId;
        private Long caseId;
        private Long counselorId;

        @NotBlank
        private String reason;

        private Priority priority = Priority.MEDIUM;

        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public Long getCaseId() { return caseId; }
        public void setCaseId(Long caseId) { this.caseId = caseId; }
        public Long getCounselorId() { return counselorId; }
        public void setCounselorId(Long counselorId) { this.counselorId = counselorId; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public Priority getPriority() { return priority; }
        public void setPriority(Priority priority) { this.priority = priority; }
    }

    public static class AssignCounselorRequest {
        @NotNull
        private Long counselorId;

        public Long getCounselorId() { return counselorId; }
        public void setCounselorId(Long counselorId) { this.counselorId = counselorId; }
    }

    public static class ReferralStatusRequest {
        @NotNull
        private ReferralStatus status;

        public ReferralStatus getStatus() { return status; }
        public void setStatus(ReferralStatus status) { this.status = status; }
    }

    public static class CreateSessionRequest {
        @NotNull
        private Integer sessionNumber;

        @NotNull
        private LocalDate sessionDate;

        private AttendanceStatus attendanceStatus = AttendanceStatus.SCHEDULED;

        private String clinicalSummary;

        public Integer getSessionNumber() { return sessionNumber; }
        public void setSessionNumber(Integer sessionNumber) { this.sessionNumber = sessionNumber; }
        public LocalDate getSessionDate() { return sessionDate; }
        public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }
        public AttendanceStatus getAttendanceStatus() { return attendanceStatus; }
        public void setAttendanceStatus(AttendanceStatus attendanceStatus) { this.attendanceStatus = attendanceStatus; }
        public String getClinicalSummary() { return clinicalSummary; }
        public void setClinicalSummary(String clinicalSummary) { this.clinicalSummary = clinicalSummary; }
    }

    public static class ReferralResponse {
        private Long id;
        private String referralNumber;
        private Long caseId;
        private String caseNumber;
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private String referrerName;
        private Long counselorId;
        private String counselorName;
        private String reason;
        private Priority priority;
        private ReferralStatus status;
        private Instant createdAt;
        private List<SessionResponse> sessions;

        public static ReferralResponse fromEntity(CounselingReferral referral) {
            ReferralResponse dto = new ReferralResponse();
            dto.setId(referral.getId());
            dto.setReferralNumber(referral.getReferralNumber());
            if (referral.getCaseRecord() != null) {
                dto.setCaseId(referral.getCaseRecord().getId());
                dto.setCaseNumber(referral.getCaseRecord().getCaseNumber());
            }
            if (referral.getStudent() != null) {
                dto.setStudentId(referral.getStudent().getId());
                dto.setStudentName(referral.getStudent().getName());
                dto.setStudentEmail(referral.getStudent().getEmail());
            }
            if (referral.getReferredBy() != null) {
                dto.setReferrerName(referral.getReferredBy().getName());
            }
            if (referral.getCounselor() != null) {
                dto.setCounselorId(referral.getCounselor().getId());
                dto.setCounselorName(referral.getCounselor().getName());
            }
            dto.setReason(referral.getReason());
            dto.setPriority(referral.getPriority());
            dto.setStatus(referral.getStatus());
            dto.setCreatedAt(referral.getCreatedAt());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getReferralNumber() { return referralNumber; }
        public void setReferralNumber(String referralNumber) { this.referralNumber = referralNumber; }
        public Long getCaseId() { return caseId; }
        public void setCaseId(Long caseId) { this.caseId = caseId; }
        public String getCaseNumber() { return caseNumber; }
        public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public String getStudentEmail() { return studentEmail; }
        public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
        public String getReferrerName() { return referrerName; }
        public void setReferrerName(String referrerName) { this.referrerName = referrerName; }
        public Long getCounselorId() { return counselorId; }
        public void setCounselorId(Long counselorId) { this.counselorId = counselorId; }
        public String getCounselorName() { return counselorName; }
        public void setCounselorName(String counselorName) { this.counselorName = counselorName; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public Priority getPriority() { return priority; }
        public void setPriority(Priority priority) { this.priority = priority; }
        public ReferralStatus getStatus() { return status; }
        public void setStatus(ReferralStatus status) { this.status = status; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public List<SessionResponse> getSessions() { return sessions; }
        public void setSessions(List<SessionResponse> sessions) { this.sessions = sessions; }
    }

    public static class SessionResponse {
        private Long id;
        private Long referralId;
        private Integer sessionNumber;
        private LocalDate sessionDate;
        private AttendanceStatus attendanceStatus;
        private String clinicalSummary;
        private Instant createdAt;

        public static SessionResponse fromEntity(CounselingSession session, boolean includeClinical) {
            SessionResponse dto = new SessionResponse();
            dto.setId(session.getId());
            if (session.getReferral() != null) {
                dto.setReferralId(session.getReferral().getId());
            }
            dto.setSessionNumber(session.getSessionNumber());
            dto.setSessionDate(session.getSessionDate());
            dto.setAttendanceStatus(session.getAttendanceStatus());
            dto.setClinicalSummary(includeClinical ? session.getClinicalSummary() : "[CONFIDENTIAL_CLINICAL_NOTE]");
            dto.setCreatedAt(session.getCreatedAt());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getReferralId() { return referralId; }
        public void setReferralId(Long referralId) { this.referralId = referralId; }
        public Integer getSessionNumber() { return sessionNumber; }
        public void setSessionNumber(Integer sessionNumber) { this.sessionNumber = sessionNumber; }
        public LocalDate getSessionDate() { return sessionDate; }
        public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }
        public AttendanceStatus getAttendanceStatus() { return attendanceStatus; }
        public void setAttendanceStatus(AttendanceStatus attendanceStatus) { this.attendanceStatus = attendanceStatus; }
        public String getClinicalSummary() { return clinicalSummary; }
        public void setClinicalSummary(String clinicalSummary) { this.clinicalSummary = clinicalSummary; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    }
}
