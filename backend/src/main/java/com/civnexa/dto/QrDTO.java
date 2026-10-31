package com.civnexa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class QrDTO {

    public static class StudentCardResponse {
        private String qrToken;
        private String userReference;
        private String fullName;
        private String rollNumber;
        private String department;
        private String status;
        private Instant issuedAt;
        private boolean revoked;

        public StudentCardResponse() {}

        public String getQrToken() { return qrToken; }
        public void setQrToken(String qrToken) { this.qrToken = qrToken; }
        public String getUserReference() { return userReference; }
        public void setUserReference(String userReference) { this.userReference = userReference; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getRollNumber() { return rollNumber; }
        public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Instant getIssuedAt() { return issuedAt; }
        public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }
        public boolean isRevoked() { return revoked; }
        public void setRevoked(boolean revoked) { this.revoked = revoked; }
    }

    public static class StudentIdVerificationResponse {
        private boolean valid;
        private String userReference;
        private String studentName;
        private String rollNumber;
        private String department;
        private String role;
        private String status;
        private String photoUrl;
        private Instant verifiedAt;
        private String message;

        public StudentIdVerificationResponse() {}

        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
        public String getUserReference() { return userReference; }
        public void setUserReference(String userReference) { this.userReference = userReference; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public String getRollNumber() { return rollNumber; }
        public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
        public Instant getVerifiedAt() { return verifiedAt; }
        public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class AttendanceSessionCreateRequest {
        @NotBlank(message = "Title is required")
        @Size(max = 150)
        private String title;

        @NotBlank(message = "Event type is required")
        private String eventType = "EVENT";

        private Long caseId;
        private Long hearingId;

        public AttendanceSessionCreateRequest() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public Long getCaseId() { return caseId; }
        public void setCaseId(Long caseId) { this.caseId = caseId; }
        public Long getHearingId() { return hearingId; }
        public void setHearingId(Long hearingId) { this.hearingId = hearingId; }
    }

    public static class AttendanceSessionResponse {
        private String sessionCode;
        private String title;
        private String eventType;
        private String activeChallenge;
        private Instant challengeExpiresAt;
        private long secondsRemaining;
        private boolean isActive;
        private long recordsCount;
        private Instant createdAt;

        public AttendanceSessionResponse() {}

        public String getSessionCode() { return sessionCode; }
        public void setSessionCode(String sessionCode) { this.sessionCode = sessionCode; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getActiveChallenge() { return activeChallenge; }
        public void setActiveChallenge(String activeChallenge) { this.activeChallenge = activeChallenge; }
        public Instant getChallengeExpiresAt() { return challengeExpiresAt; }
        public void setChallengeExpiresAt(Instant challengeExpiresAt) { this.challengeExpiresAt = challengeExpiresAt; }
        public long getSecondsRemaining() { return secondsRemaining; }
        public void setSecondsRemaining(long secondsRemaining) { this.secondsRemaining = secondsRemaining; }
        public boolean isActive() { return isActive; }
        public void setActive(boolean active) { isActive = active; }
        public long getRecordsCount() { return recordsCount; }
        public void setRecordsCount(long recordsCount) { this.recordsCount = recordsCount; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    }

    public static class AttendanceCheckInRequest {
        @NotBlank(message = "Challenge token is required")
        private String challengeToken;

        public AttendanceCheckInRequest() {}

        public String getChallengeToken() { return challengeToken; }
        public void setChallengeToken(String challengeToken) { this.challengeToken = challengeToken; }
    }

    public static class AttendanceCheckInResponse {
        private boolean success;
        private String sessionTitle;
        private String studentName;
        private Instant checkedInAt;
        private String message;

        public AttendanceCheckInResponse() {}

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getSessionTitle() { return sessionTitle; }
        public void setSessionTitle(String sessionTitle) { this.sessionTitle = sessionTitle; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public Instant getCheckedInAt() { return checkedInAt; }
        public void setCheckedInAt(Instant checkedInAt) { this.checkedInAt = checkedInAt; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class AttendanceRecordItem {
        private Long id;
        private String studentName;
        private String rollNumber;
        private String department;
        private Instant checkedInAt;
        private String verificationMethod;

        public AttendanceRecordItem() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public String getRollNumber() { return rollNumber; }
        public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public Instant getCheckedInAt() { return checkedInAt; }
        public void setCheckedInAt(Instant checkedInAt) { this.checkedInAt = checkedInAt; }
        public String getVerificationMethod() { return verificationMethod; }
        public void setVerificationMethod(String verificationMethod) { this.verificationMethod = verificationMethod; }
    }

    public static class CaseQrVerifyResponse {
        private boolean valid;
        private String caseNumber;
        private String title;
        private String category;
        private String status;
        private String priority;
        private boolean confidential;
        private boolean hasFullAccess;
        private String message;

        public CaseQrVerifyResponse() {}

        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
        public String getCaseNumber() { return caseNumber; }
        public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public boolean isConfidential() { return confidential; }
        public void setConfidential(boolean confidential) { this.confidential = confidential; }
        public boolean isHasFullAccess() { return hasFullAccess; }
        public void setHasFullAccess(boolean hasFullAccess) { this.hasFullAccess = hasFullAccess; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class EvidenceCustodyActionRequest {
        @NotBlank(message = "Action is required")
        private String action;

        private String details;

        public EvidenceCustodyActionRequest() {}

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
    }

    public static class EvidenceCustodyResponse {
        private boolean valid;
        private String evidenceReference;
        private String caseNumber;
        private String fileName;
        private String fileType;
        private Long fileSizeBytes;
        private String reviewStatus;
        private String sha256Checksum;
        private List<CustodyLogItem> custodyTrail = new ArrayList<>();
        private String message;

        public EvidenceCustodyResponse() {}

        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }
        public String getEvidenceReference() { return evidenceReference; }
        public void setEvidenceReference(String evidenceReference) { this.evidenceReference = evidenceReference; }
        public String getCaseNumber() { return caseNumber; }
        public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getFileType() { return fileType; }
        public void setFileType(String fileType) { this.fileType = fileType; }
        public Long getFileSizeBytes() { return fileSizeBytes; }
        public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
        public String getReviewStatus() { return reviewStatus; }
        public void setReviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; }
        public String getSha256Checksum() { return sha256Checksum; }
        public void setSha256Checksum(String sha256Checksum) { this.sha256Checksum = sha256Checksum; }
        public List<CustodyLogItem> getCustodyTrail() { return custodyTrail; }
        public void setCustodyTrail(List<CustodyLogItem> custodyTrail) { this.custodyTrail = custodyTrail; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class CustodyLogItem {
        private String action;
        private String actorName;
        private String actorRole;
        private String details;
        private Instant timestamp;

        public CustodyLogItem() {}

        public CustodyLogItem(String action, String actorName, String actorRole, String details, Instant timestamp) {
            this.action = action;
            this.actorName = actorName;
            this.actorRole = actorRole;
            this.details = details;
            this.timestamp = timestamp;
        }

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getActorName() { return actorName; }
        public void setActorName(String actorName) { this.actorName = actorName; }
        public String getActorRole() { return actorRole; }
        public void setActorRole(String actorRole) { this.actorRole = actorRole; }
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }
}
