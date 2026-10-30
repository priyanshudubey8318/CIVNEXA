package com.civnexa.entity;

import com.civnexa.entity.enums.RowProcessingStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "import_row_results", indexes = {
    @Index(name = "idx_import_row_job", columnList = "job_id"),
    @Index(name = "idx_import_row_status", columnList = "status"),
    @Index(name = "idx_import_row_ident", columnList = "record_identifier")
})
public class ImportRowResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false, foreignKey = @ForeignKey(name = "fk_import_row_job"))
    private ImportJob importJob;

    @NotNull
    @Column(name = "row_number", nullable = false)
    private Integer rowNumber;

    @Size(max = 120)
    @Column(name = "record_identifier", length = 120)
    private String recordIdentifier;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RowProcessingStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Size(max = 50)
    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "processed_at", nullable = false, updatable = false)
    private Instant processedAt = Instant.now();

    public ImportRowResult() {
    }

    public ImportRowResult(ImportJob importJob, Integer rowNumber, String recordIdentifier, RowProcessingStatus status) {
        this.importJob = importJob;
        this.rowNumber = rowNumber;
        this.recordIdentifier = recordIdentifier;
        this.status = status;
        this.processedAt = Instant.now();
    }

    public ImportRowResult(ImportJob importJob, Integer rowNumber, String recordIdentifier, RowProcessingStatus status, String errorMessage, String errorCode) {
        this.importJob = importJob;
        this.rowNumber = rowNumber;
        this.recordIdentifier = recordIdentifier;
        this.status = status;
        this.errorMessage = errorMessage;
        this.errorCode = errorCode;
        this.processedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (processedAt == null) processedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ImportJob getImportJob() {
        return importJob;
    }

    public void setImportJob(ImportJob importJob) {
        this.importJob = importJob;
    }

    public Integer getRowNumber() {
        return rowNumber;
    }

    public void setRowNumber(Integer rowNumber) {
        this.rowNumber = rowNumber;
    }

    public String getRecordIdentifier() {
        return recordIdentifier;
    }

    public void setRecordIdentifier(String recordIdentifier) {
        this.recordIdentifier = recordIdentifier;
    }

    public RowProcessingStatus getStatus() {
        return status;
    }

    public void setStatus(RowProcessingStatus status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public Instant getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(Instant processedAt) {
        this.processedAt = processedAt;
    }

    @Override
    public String toString() {
        return "ImportRowResult{" +
                "id=" + id +
                ", rowNumber=" + rowNumber +
                ", recordIdentifier='" + recordIdentifier + '\'' +
                ", status=" + status +
                ", errorCode='" + errorCode + '\'' +
                ", processedAt=" + processedAt +
                '}';
    }
}
