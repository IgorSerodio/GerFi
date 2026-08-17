-- 026_recreate_index.sql
BEGIN;

-- Remove o índice antigo de encaminhamento único
DROP INDEX IF EXISTS idx_tickets_unique_forward;

-- Recria o índice para considerar o forward_type, garantindo que encaminhamentos 
-- individuais não conflitem acidentalmente com grupos de mesmo nome.
CREATE UNIQUE INDEX idx_tickets_unique_forward 
ON tickets(ticket_number, (created_at::date), location_id, forward_type, COALESCE(forwarded_to, ''));

COMMIT;
