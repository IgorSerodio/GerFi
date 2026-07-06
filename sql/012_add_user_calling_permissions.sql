-- 012_add_user_calling_permissions.sql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS can_call_normal BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS can_call_priority BOOLEAN NOT NULL DEFAULT TRUE;
