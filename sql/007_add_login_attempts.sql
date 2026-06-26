-- 007_add_login_attempts.sql
-- Add failed_login_attempts and locked_until columns to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
