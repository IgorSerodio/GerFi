-- 014_refactor_forwarding.sql
BEGIN;

ALTER TABLE tickets ADD COLUMN forwarded_to VARCHAR(50);

-- Unique index to prevent the exact same ticket on the exact same day from being duplicated
-- unless it's forwarded to different targets.
-- The COALESCE ensures NULL is treated as an empty string for the unique constraint.
CREATE UNIQUE INDEX idx_tickets_unique_forward 
ON tickets(ticket_number, (created_at::date), COALESCE(forwarded_to, ''));

COMMIT;
