-- =============================================================================
-- CIVNEXA Database Migration: V2__add_user_import_tracking.sql
-- Description: Bulk User Import Job & Row Result Tracking Schema
-- Dialect: MySQL 8 / ANSI SQL Compatible (Engine=InnoDB, Charset=utf8mb4)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 15. Table: import_jobs
-- Bulk user import tracking for administrative provisioning via XLSX, CSV, JSON
-- -----------------------------------------------------------------------------
CREATE TABLE import_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_reference VARCHAR(50) NOT NULL UNIQUE,
    initiated_by_id BIGINT,
    import_type VARCHAR(40) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_format VARCHAR(20) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    file_checksum VARCHAR(64),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    total_records INT NOT NULL DEFAULT 0,
    processed_records INT NOT NULL DEFAULT 0,
    failed_records INT NOT NULL DEFAULT 0,
    skipped_records INT NOT NULL DEFAULT 0,
    summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_import_job_admin FOREIGN KEY (initiated_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_import_job_ref ON import_jobs(job_reference);
CREATE INDEX idx_import_job_admin ON import_jobs(initiated_by_id);
CREATE INDEX idx_import_job_status ON import_jobs(status);
CREATE INDEX idx_import_job_created ON import_jobs(created_at);

-- -----------------------------------------------------------------------------
-- 16. Table: import_row_results
-- Row-level processing outcome and error diagnostics for bulk user imports
-- -----------------------------------------------------------------------------
CREATE TABLE import_row_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT NOT NULL,
    row_number INT NOT NULL,
    record_identifier VARCHAR(120),
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    error_code VARCHAR(50),
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_import_row_job FOREIGN KEY (job_id) REFERENCES import_jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_import_row_job ON import_row_results(job_id);
CREATE INDEX idx_import_row_status ON import_row_results(status);
CREATE INDEX idx_import_row_ident ON import_row_results(record_identifier);
