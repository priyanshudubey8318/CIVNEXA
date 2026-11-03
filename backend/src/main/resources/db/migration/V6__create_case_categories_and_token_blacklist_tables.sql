-- =============================================================================
-- CIVNEXA Database Migration: V6__create_case_categories_and_token_blacklist_tables.sql
-- Description: Dynamic Case Category Registry and Server-Side JWT Token Revocation Blacklist.
-- Dialect: MySQL 8 / ANSI SQL Compatible (Engine=InnoDB, Charset=utf8mb4)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: case_categories
-- Dynamic administrative incident category configuration with anonymous submission support
-- -----------------------------------------------------------------------------
CREATE TABLE case_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_key VARCHAR(50) NOT NULL UNIQUE,
    label VARCHAR(150) NOT NULL,
    description TEXT,
    allows_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    subcategories TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cat_key ON case_categories(category_key);
CREATE INDEX idx_cat_active ON case_categories(active);

-- Seed initial standardized case categories
INSERT INTO case_categories (category_key, label, description, allows_anonymous, subcategories, active) VALUES
('DISCIPLINE', 'Discipline & Misconduct', 'General misconduct, classroom disruptions, exam irregularities, and student code of conduct violations.', FALSE, 'Classroom Disruption, Exam Malpractice, Defiance of Authority, Unauthorized Assembly, Substance Possession', TRUE),
('ACADEMIC_GRIEVANCE', 'Academic Grievance', 'Evaluation disputes, attendance discrepancies, faculty grievances, and internal marks reassessments.', FALSE, 'Grading Dispute, Attendance Shortage, Faculty Grievance, Course Material Issue, Exam Scheduling Conflict', TRUE),
('CAMPUS_SAFETY', 'Campus Safety & Security', 'Theft, vandalism, trespass, safety hazards, and physical altercations on university premises.', TRUE, 'Property Theft, Vandalism, Trespass, Physical Altercation, Unsafe Facility, Electrical Hazard', TRUE),
('HARASSMENT', 'Harassment & Bullying', 'Verbal harassment, cyberbullying, discrimination, and peer hostility in academic and residential zones.', TRUE, 'Verbal Abuse, Cyberbullying, Discriminatory Bias, Hostel Harassment, Social Exclusion', TRUE),
('RAGGING', 'Anti-Ragging Compliance', 'UGC/AICTE statutory anti-ragging violations requiring immediate Proctorial inquiry and escalation.', TRUE, 'Physical Ragging, Psychological Harassment, Forced Subjugation, Hostel Ragging, Humiliation', TRUE),
('FACILITIES_INFRASTRUCTURE', 'Facilities & Infrastructure', 'Hostel maintenance, laboratory equipment failures, library facilities, sanitation, and campus amenities.', TRUE, 'Hostel Maintenance, Lab Equipment, Library Access, Sanitation & Hygiene, Mess Quality, Internet Connectivity', TRUE);

-- -----------------------------------------------------------------------------
-- 2. Table: revoked_tokens
-- Authoritative server-side JWT token revocation blacklist with expiration tracking
-- -----------------------------------------------------------------------------
CREATE TABLE revoked_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_id VARCHAR(100) NOT NULL UNIQUE,
    user_reference VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_revoked_token_id ON revoked_tokens(token_id);
CREATE INDEX idx_revoked_user_ref ON revoked_tokens(user_reference);
CREATE INDEX idx_revoked_expires_at ON revoked_tokens(expires_at);
