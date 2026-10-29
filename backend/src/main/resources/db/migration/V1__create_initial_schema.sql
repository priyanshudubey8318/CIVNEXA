-- =============================================================================
-- CIVNEXA Database Migration: V1__create_initial_schema.sql
-- Description: Complete initial relational schema for CIVNEXA Campus Conduct,
--              Grievance, Safety and Student Support Management System.
-- Dialect: MySQL 8 / ANSI SQL Compatible (Engine=InnoDB, Charset=utf8mb4)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: departments
-- Institutional academic and administrative departments
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    hod_name VARCHAR(100),
    contact_email VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dept_code ON departments(code);
CREATE INDEX idx_dept_status ON departments(status);

-- -----------------------------------------------------------------------------
-- 2. Table: users
-- Unified institutional identity table for all 8 roles
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_reference VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    department_id BIGINT,
    title VARCHAR(150),
    phone VARCHAR(30),
    avatar VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    roll_number VARCHAR(30),
    enrollment_number VARCHAR(50),
    course VARCHAR(100),
    semester VARCHAR(30),
    section VARCHAR(10),
    cgpa DECIMAL(4,2),
    hostel_details VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_ref ON users(user_reference);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_user_roll ON users(roll_number);
CREATE INDEX idx_user_dept ON users(department_id);

-- -----------------------------------------------------------------------------
-- 3. Table: cases
-- Consolidated registry for disciplinary incidents and student grievances
-- -----------------------------------------------------------------------------
CREATE TABLE cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(30) NOT NULL UNIQUE,
    case_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(100),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    department_id BIGINT,
    student_id BIGINT,
    reporter_id BIGINT,
    assigned_to_id BIGINT,
    incident_date TIMESTAMP NULL,
    incident_time VARCHAR(10),
    location VARCHAR(150),
    summary TEXT NOT NULL,
    remarks TEXT,
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    concerned_person VARCHAR(150),
    next_action_deadline TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_case_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_case_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_case_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_case_assigned FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_case_number ON cases(case_number);
CREATE INDEX idx_case_status ON cases(status);
CREATE INDEX idx_case_type ON cases(case_type);
CREATE INDEX idx_case_category ON cases(category);
CREATE INDEX idx_case_student ON cases(student_id);
CREATE INDEX idx_case_reporter ON cases(reporter_id);
CREATE INDEX idx_case_assigned ON cases(assigned_to_id);
CREATE INDEX idx_case_dept ON cases(department_id);

-- -----------------------------------------------------------------------------
-- 4. Table: case_investigation_notes
-- Confidential notes recorded during formal inquiry
-- -----------------------------------------------------------------------------
CREATE TABLE case_investigation_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    note TEXT NOT NULL,
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_note_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_note_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_note_case ON case_investigation_notes(case_id);
CREATE INDEX idx_note_author ON case_investigation_notes(author_id);

-- -----------------------------------------------------------------------------
-- 5. Table: student_responses
-- Formal explanations and defenses submitted by students
-- -----------------------------------------------------------------------------
CREATE TABLE student_responses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    response_text TEXT NOT NULL,
    declaration_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resp_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_resp_student FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX idx_resp_case ON student_responses(case_id);
CREATE INDEX idx_resp_student ON student_responses(student_id);

-- -----------------------------------------------------------------------------
-- 6. Table: case_activities
-- Internal procedural timeline and status transition log
-- -----------------------------------------------------------------------------
CREATE TABLE case_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_id BIGINT,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_act_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_act_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_act_case ON case_activities(case_id);
CREATE INDEX idx_act_timestamp ON case_activities(timestamp);

-- -----------------------------------------------------------------------------
-- 7. Table: evidence_items
-- Evidence vault metadata records for physical and digital exhibits
-- -----------------------------------------------------------------------------
CREATE TABLE evidence_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evidence_reference VARCHAR(50) NOT NULL UNIQUE,
    case_id BIGINT NOT NULL,
    uploader_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_reference VARCHAR(500) NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    review_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by_id BIGINT,
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT,
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ev_case FOREIGN KEY (case_id) REFERENCES cases(id),
    CONSTRAINT fk_ev_uploader FOREIGN KEY (uploader_id) REFERENCES users(id),
    CONSTRAINT fk_ev_reviewer FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ev_ref ON evidence_items(evidence_reference);
CREATE INDEX idx_ev_case ON evidence_items(case_id);
CREATE INDEX idx_ev_uploader ON evidence_items(uploader_id);
CREATE INDEX idx_ev_status ON evidence_items(review_status);

-- -----------------------------------------------------------------------------
-- 8. Table: evidence_custody_logs
-- Append-only chain of custody ledger for exhibits
-- -----------------------------------------------------------------------------
CREATE TABLE evidence_custody_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evidence_id BIGINT NOT NULL,
    actor_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_custody_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_items(id),
    CONSTRAINT fk_custody_actor FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE INDEX idx_custody_ev ON evidence_custody_logs(evidence_id);
CREATE INDEX idx_custody_time ON evidence_custody_logs(timestamp);

-- -----------------------------------------------------------------------------
-- 9. Table: hearings
-- Scheduled proctorial board proceedings and deliberations
-- -----------------------------------------------------------------------------
CREATE TABLE hearings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hearing_number VARCHAR(30) NOT NULL UNIQUE,
    case_id BIGINT NOT NULL,
    scheduled_by_id BIGINT NOT NULL,
    presiding_authority_id BIGINT NOT NULL,
    hearing_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(150) NOT NULL,
    mode VARCHAR(30) NOT NULL DEFAULT 'IN_PERSON',
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    remarks TEXT,
    outcome TEXT,
    minutes_draft TEXT,
    minutes_finalized_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hearing_case FOREIGN KEY (case_id) REFERENCES cases(id),
    CONSTRAINT fk_hearing_scheduler FOREIGN KEY (scheduled_by_id) REFERENCES users(id),
    CONSTRAINT fk_hearing_presiding FOREIGN KEY (presiding_authority_id) REFERENCES users(id)
);

CREATE INDEX idx_hearing_num ON hearings(hearing_number);
CREATE INDEX idx_hearing_case ON hearings(case_id);
CREATE INDEX idx_hearing_date ON hearings(hearing_date);
CREATE INDEX idx_hearing_venue ON hearings(venue);

-- -----------------------------------------------------------------------------
-- 10. Table: hearing_committee_members
-- Attendance roster and panel composition for scheduled hearings
-- -----------------------------------------------------------------------------
CREATE TABLE hearing_committee_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hearing_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT uq_hearing_member UNIQUE (hearing_id, member_id),
    CONSTRAINT fk_hcm_hearing FOREIGN KEY (hearing_id) REFERENCES hearings(id) ON DELETE CASCADE,
    CONSTRAINT fk_hcm_member FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_hcm_hearing ON hearing_committee_members(hearing_id);
CREATE INDEX idx_hcm_member ON hearing_committee_members(member_id);

-- -----------------------------------------------------------------------------
-- 11. Table: appeals
-- Appellate review petitions against proctorial determinations
-- -----------------------------------------------------------------------------
CREATE TABLE appeals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appeal_number VARCHAR(30) NOT NULL UNIQUE,
    case_id BIGINT NOT NULL,
    appellant_id BIGINT NOT NULL,
    assigned_reviewer_id BIGINT,
    status VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED',
    grounds VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    relief_sought TEXT NOT NULL,
    original_decision_summary TEXT NOT NULL,
    original_decision_date TIMESTAMP NULL,
    original_sanction_type VARCHAR(50),
    appeal_deadline TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recommendation TEXT,
    final_outcome TEXT,
    decided_at TIMESTAMP NULL,
    decided_by_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appeal_case FOREIGN KEY (case_id) REFERENCES cases(id),
    CONSTRAINT fk_appeal_appellant FOREIGN KEY (appellant_id) REFERENCES users(id),
    CONSTRAINT fk_appeal_reviewer FOREIGN KEY (assigned_reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_appeal_decided_by FOREIGN KEY (decided_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_appeal_num ON appeals(appeal_number);
CREATE INDEX idx_appeal_case ON appeals(case_id);
CREATE INDEX idx_appeal_appellant ON appeals(appellant_id);
CREATE INDEX idx_appeal_status ON appeals(status);

-- -----------------------------------------------------------------------------
-- 12. Table: counseling_referrals
-- Confidential referrals for student counseling and mental health support
-- -----------------------------------------------------------------------------
CREATE TABLE counseling_referrals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    referral_number VARCHAR(30) NOT NULL UNIQUE,
    case_id BIGINT,
    student_id BIGINT NOT NULL,
    referred_by_id BIGINT NOT NULL,
    counselor_id BIGINT,
    reason TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    scheduled_date DATE,
    confidential_notes TEXT,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_couns_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
    CONSTRAINT fk_couns_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_couns_referrer FOREIGN KEY (referred_by_id) REFERENCES users(id),
    CONSTRAINT fk_couns_counselor FOREIGN KEY (counselor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_couns_ref ON counseling_referrals(referral_number);
CREATE INDEX idx_couns_student ON counseling_referrals(student_id);
CREATE INDEX idx_couns_counselor ON counseling_referrals(counselor_id);
CREATE INDEX idx_couns_case ON counseling_referrals(case_id);
CREATE INDEX idx_couns_status ON counseling_referrals(status);

-- -----------------------------------------------------------------------------
-- 13. Table: counseling_sessions
-- Individual session attendance and clinical progress notes
-- -----------------------------------------------------------------------------
CREATE TABLE counseling_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    referral_id BIGINT NOT NULL,
    session_number INT NOT NULL,
    session_date DATE NOT NULL,
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    clinical_summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_csess_referral FOREIGN KEY (referral_id) REFERENCES counseling_referrals(id) ON DELETE CASCADE
);

CREATE INDEX idx_csess_ref ON counseling_sessions(referral_id);
CREATE INDEX idx_csess_date ON counseling_sessions(session_date);

-- -----------------------------------------------------------------------------
-- 14. Table: audit_logs
-- Append-only system-level audit trail for regulatory compliance
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_uuid VARCHAR(36) NOT NULL UNIQUE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    actor_id BIGINT,
    actor_name VARCHAR(100) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_uuid ON audit_logs(event_uuid);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
