package com.civnexa.entity;

import com.civnexa.entity.enums.ImportFileFormat;
import com.civnexa.entity.enums.ImportStatus;
import com.civnexa.entity.enums.ImportType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "import_jobs", indexes = {
    @Index(name = "idx_import_job_ref", columnList = "job_reference", unique = true),
    @Index(name = "idx_import_job_admin", columnList = "initiated_by_id"),
    @Index(name = "idx_import_job_status", columnList = "status"),
    @Index(name = "idx_import_job_created", columnList = "created_at")
})
public class ImportJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "job_reference", nullable = false, unique = true, length = 50)
    private String jobReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by_id", foreignKey = @ForeignKey(name = "fk_import_job_admin"))
    private User initiatedBy;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "import_type", nullable = false, length = 40)
    private ImportType importType;

    @NotBlank
    @Size(max = 255)
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "file_format", nullable = false, length = 20)
    private ImportFileFormat fileFormat;

    @NotNull
    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @Size(max = 64)
    @Column(name = "file_checksum", length = 64)
    private String fileChecksum;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ImportStatus status = ImportStatus.PENDING;

    @NotNull
    @Column(name = "total_records", nullable = false)
    private Integer totalRecords = 0;

    @NotNull
    @Column(name = "processed_records", nullable = false)
    private Integer processedRecords = 0;

    @NotNull
    @Column(name = "failed_records", nullable = false)
    private Integer failedRecords = 0;

    @NotNull
    @Column(name = "skipped_records", nullable = false)
    private Integer skippedRecords = 0;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "importJob", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImportRowResult> rowResults = new ArrayList<>();

    public ImportJob() {
    }

    public ImportJob(String jobReference, User initiatedBy, ImportType importType, String fileName, ImportFileFormat fileFormat, Long fileSizeBytes) {
        this.jobReference = jobReference;
        this.initiatedBy = initiatedBy;
        this.importType = importType;
        this.fileName = fileName;
        this.fileFormat = fileFormat;
        this.fileSizeBytes = fileSizeBytes;
        this.status = ImportStatus.PENDING;
        this.totalRecords = 0;
        this.processedRecords = 0;
        this.failedRecords = 0;
        this.skippedRecords = 0;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = ImportStatus.PENDING;
        if (totalRecords == null) totalRecords = 0;
        if (processedRecords == null) processedRecords = 0;
        if (failedRecords == null) failedRecords = 0;
        if (skippedRecords == null) skippedRecords = 0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getJobReference() {
        return jobReference;
    }

    public void setJobReference(String jobReference) {
        this.jobReference = jobReference;
    }

    public User getInitiatedBy() {
        return initiatedBy;
    }

    public void setInitiatedBy(User initiatedBy) {
        this.initiatedBy = initiatedBy;
    }

    public ImportType getImportType() {
        return importType;
    }

    public void setImportType(ImportType importType) {
        this.importType = importType;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public ImportFileFormat getFileFormat() {
        return fileFormat;
    }

    public void setFileFormat(ImportFileFormat fileFormat) {
        this.fileFormat = fileFormat;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getFileChecksum() {
        return fileChecksum;
    }

    public void setFileChecksum(String fileChecksum) {
        this.fileChecksum = fileChecksum;
    }

    public ImportStatus getStatus() {
        return status;
    }

    public void setStatus(ImportStatus status) {
        this.status = status;
    }

    public Integer getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(Integer totalRecords) {
        this.totalRecords = totalRecords;
    }

    public Integer getProcessedRecords() {
        return processedRecords;
    }

    public void setProcessedRecords(Integer processedRecords) {
        this.processedRecords = processedRecords;
    }

    public Integer getFailedRecords() {
        return failedRecords;
    }

    public void setFailedRecords(Integer failedRecords) {
        this.failedRecords = failedRecords;
    }

    public Integer getSkippedRecords() {
        return skippedRecords;
    }

    public void setSkippedRecords(Integer skippedRecords) {
        this.skippedRecords = skippedRecords;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public List<ImportRowResult> getRowResults() {
        return rowResults;
    }

    public void setRowResults(List<ImportRowResult> rowResults) {
        this.rowResults = rowResults;
    }

    public void addRowResult(ImportRowResult rowResult) {
        this.rowResults.add(rowResult);
        rowResult.setImportJob(this);
    }

    @Override
    public String toString() {
        return "ImportJob{" +
                "id=" + id +
                ", jobReference='" + jobReference + '\'' +
                ", importType=" + importType +
                ", fileName='" + fileName + '\'' +
                ", fileFormat=" + fileFormat +
                ", status=" + status +
                ", totalRecords=" + totalRecords +
                ", processedRecords=" + processedRecords +
                ", failedRecords=" + failedRecords +
                ", skippedRecords=" + skippedRecords +
                ", createdAt=" + createdAt +
                '}';
    }
}
