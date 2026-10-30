-- =============================================================================
-- CIVNEXA Database Migration: V4__add_email_verification_table.sql
-- Description: Table for storing cryptographically hashed email OTP challenges
-- Dialect: MySQL 8 / ANSI SQL Compatible (Engine=InnoDB, Charset=utf8mb4)
-- =============================================================================

CREATE TABLE email_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at TIMESTAMP NOT NULL,
    resend_available_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verif_email ON email_verifications(email);
CREATE INDEX idx_email_verif_created ON email_verifications(created_at);
