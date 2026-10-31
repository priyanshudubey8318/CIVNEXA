-- =============================================================================
-- CIVNEXA Database Migration: V5__add_security_hardening_ai_and_qr.sql
-- Description: Security hardening (password change flag, QR tokens), Attendance Sessions, and AI Knowledge Documents
-- Dialect: MySQL 8 / ANSI SQL Compatible (Engine=InnoDB, Charset=utf8mb4)
-- =============================================================================

-- 1. Security & Identity Hardening on Users
ALTER TABLE users ADD COLUMN password_change_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN qr_token VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN qr_issued_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN qr_revoked BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_user_qr_token ON users(qr_token);

-- 2. Case Tracking QR Token
ALTER TABLE cases ADD COLUMN qr_tracking_token VARCHAR(64) NULL;
CREATE INDEX idx_case_qr_token ON cases(qr_tracking_token);

-- 3. Evidence Custody QR Token
ALTER TABLE evidence_items ADD COLUMN qr_custody_token VARCHAR(64) NULL;
CREATE INDEX idx_evidence_qr_token ON evidence_items(qr_custody_token);

-- 4. Dynamic Event & Hearing Attendance Sessions
CREATE TABLE attendance_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    case_id BIGINT NULL,
    hearing_id BIGINT NULL,
    creator_id BIGINT NOT NULL,
    active_challenge VARCHAR(64) NOT NULL,
    challenge_expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_att_sess_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_sess_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    CONSTRAINT fk_att_sess_hearing FOREIGN KEY (hearing_id) REFERENCES hearings(id) ON DELETE SET NULL
);
CREATE INDEX idx_att_sess_code ON attendance_sessions(session_code);

-- 5. Attendance Records (Enforces unique session+student to prevent duplicate check-ins)
CREATE TABLE attendance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verification_method VARCHAR(30) NOT NULL DEFAULT 'QR_SCAN',
    challenge_token VARCHAR(64) NOT NULL,
    CONSTRAINT fk_att_rec_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_rec_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_session_student UNIQUE (session_id, student_id)
);
CREATE INDEX idx_att_rec_session ON attendance_records(session_id);
CREATE INDEX idx_att_rec_student ON attendance_records(student_id);

-- 6. AI Institutional Knowledge Documents for RAG
CREATE TABLE ai_knowledge_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    source_filename VARCHAR(255) NOT NULL,
    uploaded_by BIGINT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_doc_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_ai_doc_category ON ai_knowledge_documents(category);
CREATE INDEX idx_ai_doc_code ON ai_knowledge_documents(document_code);
