-- 017_update_tickets_unique_index.sql
BEGIN;

DROP INDEX IF EXISTS idx_tickets_unique_forward;

-- Unique index to prevent the exact same ticket on the exact same day from being duplicated
-- unless it's forwarded to different targets or issued in different locations.
CREATE UNIQUE INDEX idx_tickets_unique_forward 
ON tickets(location_id, ticket_number, (created_at::date), COALESCE(forwarded_to, ''));

COMMIT;
