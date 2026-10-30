-- =============================================================================
-- CIVNEXA Database Migration: V3__change_default_user_status_to_pending_verification.sql
-- Description: Update default account status on users table to PENDING_VERIFICATION
-- Dialect: MySQL 8 / ANSI SQL Compatible (Engine=InnoDB, Charset=utf8mb4)
-- =============================================================================

ALTER TABLE users ALTER COLUMN status SET DEFAULT 'PENDING_VERIFICATION';
