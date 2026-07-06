ALTER TABLE tickets ADD COLUMN security_code CHAR(4);
ALTER TABLE tickets ADD COLUMN started_at TIMESTAMPTZ;
