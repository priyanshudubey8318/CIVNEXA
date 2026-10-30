package com.civnexa.dto;

import com.civnexa.entity.EvidenceCustodyLog;
import com.civnexa.entity.EvidenceItem;
import com.civnexa.entity.enums.ReviewStatus;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class EvidenceDTO {

    public static class ReviewRequest {
        @NotNull
        private ReviewStatus reviewStatus;
        private String verificationNotes;

        public ReviewStatus getReviewStatus() { return reviewStatus; }
        public void setReviewStatus(ReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }
        public String getVerificationNotes() { return verificationNotes; }
        public void setVerificationNotes(String verificationNotes) { this.verificationNotes = verificationNotes; }
    }

    public static class Response {
        private Long id;
        private String evidenceReference;
        private Long caseId;
        private String caseNumber;
        private String fileName;
        private String fileType;
        private Long fileSizeBytes;
        private String sha256Checksum;
        private String storageReference;
        private ReviewStatus reviewStatus;
        private String uploaderName;
        private String uploaderRole;
        private Instant uploadedAt;

        public static Response fromEntity(EvidenceItem item) {
            Response dto = new Response();
            dto.setId(item.getId());
            dto.setEvidenceReference(item.getEvidenceReference());
            if (item.getCaseRecord() != null) {
                dto.setCaseId(item.getCaseRecord().getId());
                dto.setCaseNumber(item.getCaseRecord().getCaseNumber());
            }
            dto.setFileName(item.getFileName());
            dto.setFileType(item.getFileType());
            dto.setFileSizeBytes(item.getFileSizeBytes());
            dto.setSha256Checksum(item.getSha256Checksum());
            dto.setStorageReference(item.getStorageReference());
            dto.setReviewStatus(item.getReviewStatus());
            if (item.getUploader() != null) {
                dto.setUploaderName(item.getUploader().getName());
                dto.setUploaderRole(item.getUploader().getRole() != null ? item.getUploader().getRole().name() : null);
            }
            dto.setUploadedAt(item.getUploadedAt());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getEvidenceReference() { return evidenceReference; }
        public void setEvidenceReference(String evidenceReference) { this.evidenceReference = evidenceReference; }
        public Long getCaseId() { return caseId; }
        public void setCaseId(Long caseId) { this.caseId = caseId; }
        public String getCaseNumber() { return caseNumber; }
        public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getFileType() { return fileType; }
        public void setFileType(String fileType) { this.fileType = fileType; }
        public Long getFileSizeBytes() { return fileSizeBytes; }
        public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
        public String getSha256Checksum() { return sha256Checksum; }
        public void setSha256Checksum(String sha256Checksum) { this.sha256Checksum = sha256Checksum; }
        public String getStorageReference() { return storageReference; }
        public void setStorageReference(String storageReference) { this.storageReference = storageReference; }
        public ReviewStatus getReviewStatus() { return reviewStatus; }
        public void setReviewStatus(ReviewStatus reviewStatus) { this.reviewStatus = reviewStatus; }
        public String getUploaderName() { return uploaderName; }
        public void setUploaderName(String uploaderName) { this.uploaderName = uploaderName; }
        public String getUploaderRole() { return uploaderRole; }
        public void setUploaderRole(String uploaderRole) { this.uploaderRole = uploaderRole; }
        public Instant getUploadedAt() { return uploadedAt; }
        public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }
    }

    public static class CustodyLogItem {
        private Long id;
        private String action;
        private String actorName;
        private String actorRole;
        private String verificationNotes;
        private Instant timestamp;

        public static CustodyLogItem fromEntity(EvidenceCustodyLog log) {
            CustodyLogItem dto = new CustodyLogItem();
            dto.setId(log.getId());
            dto.setAction(log.getAction());
            dto.setActorName(log.getActor() != null ? log.getActor().getName() : "SYSTEM");
            dto.setActorRole(log.getActor() != null && log.getActor().getRole() != null ? log.getActor().getRole().name() : "SYSTEM");
            dto.setVerificationNotes(log.getDetails());
            dto.setTimestamp(log.getTimestamp());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getActorName() { return actorName; }
        public void setActorName(String actorName) { this.actorName = actorName; }
        public String getActorRole() { return actorRole; }
        public void setActorRole(String actorRole) { this.actorRole = actorRole; }
        public String getVerificationNotes() { return verificationNotes; }
        public void setVerificationNotes(String verificationNotes) { this.verificationNotes = verificationNotes; }
        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    }
}
