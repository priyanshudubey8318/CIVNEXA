package com.civnexa.entity;

import com.civnexa.entity.enums.ReviewStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "evidence_items", indexes = {
    @Index(name = "idx_ev_ref", columnList = "evidence_reference", unique = true),
    @Index(name = "idx_ev_case", columnList = "case_id"),
    @Index(name = "idx_ev_uploader", columnList = "uploader_id"),
    @Index(name = "idx_ev_status", columnList = "review_status")
})
public class EvidenceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "evidence_reference", nullable = false, unique = true, length = 50)
    private String evidenceReference;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false, foreignKey = @ForeignKey(name = "fk_ev_case"))
    private CaseRecord caseRecord;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false, foreignKey = @ForeignKey(name = "fk_ev_uploader"))
    private User uploader;

    @NotBlank
    @Size(max = 255)
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    @NotNull
    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @NotBlank
    @Size(max = 500)
    @Column(name = "storage_reference", nullable = false, length = 500)
    private String storageReference;

    @NotBlank
    @Size(max = 64)
    @Column(name = "sha256_checksum", nullable = false, length = 64)
    private String sha256Checksum;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 20)
    private ReviewStatus reviewStatus = ReviewStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id", foreignKey = @ForeignKey(name = "fk_ev_reviewer"))
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "is_confidential", nullable = false)
    private boolean isConfidential = false;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();

    @Size(max = 64)
    @Column(name = "qr_custody_token", length = 64)
    private String qrCustodyToken;

    public EvidenceItem() {
    }

    public EvidenceItem(String evidenceReference, CaseRecord caseRecord, User uploader, String fileName, String fileType, Long fileSizeBytes, String storageReference, String sha256Checksum) {
        this.evidenceReference = evidenceReference;
        this.caseRecord = caseRecord;
        this.uploader = uploader;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSizeBytes = fileSizeBytes;
        this.storageReference = storageReference;
        this.sha256Checksum = sha256Checksum;
        this.reviewStatus = ReviewStatus.PENDING;
        this.uploadedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (uploadedAt == null) uploadedAt = Instant.now();
        if (reviewStatus == null) reviewStatus = ReviewStatus.PENDING;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEvidenceReference() {
        return evidenceReference;
    }

    public void setEvidenceReference(String evidenceReference) {
        this.evidenceReference = evidenceReference;
    }

    public CaseRecord getCaseRecord() {
        return caseRecord;
    }

    public void setCaseRecord(CaseRecord caseRecord) {
        this.caseRecord = caseRecord;
    }

    public User getUploader() {
        return uploader;
    }

    public void setUploader(User uploader) {
        this.uploader = uploader;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getStorageReference() {
        return storageReference;
    }

    public void setStorageReference(String storageReference) {
        this.storageReference = storageReference;
    }

    public String getSha256Checksum() {
        return sha256Checksum;
    }

    public void setSha256Checksum(String sha256Checksum) {
        this.sha256Checksum = sha256Checksum;
    }

    public ReviewStatus getReviewStatus() {
        return reviewStatus;
    }

    public void setReviewStatus(ReviewStatus reviewStatus) {
        this.reviewStatus = reviewStatus;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(User reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }

    public boolean isConfidential() {
        return isConfidential;
    }

    public void setConfidential(boolean confidential) {
        isConfidential = confidential;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getQrCustodyToken() {
        return qrCustodyToken;
    }

    public void setQrCustodyToken(String qrCustodyToken) {
        this.qrCustodyToken = qrCustodyToken;
    }

    @Override
    public String toString() {
        return "EvidenceItem{" +
                "id=" + id +
                ", evidenceReference='" + evidenceReference + '\'' +
                ", fileName='" + fileName + '\'' +
                ", fileType='" + fileType + '\'' +
                ", reviewStatus=" + reviewStatus +
                ", isConfidential=" + isConfidential +
                '}';
    }
}
