-- 025_add_ticket_windows_group.sql
BEGIN;

-- Adiciona a coluna de grupo aos guichês
ALTER TABLE ticket_windows ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);

-- Cria o novo tipo enumerado para o tipo de alvo de encaminhamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forward_target_type') THEN
        CREATE TYPE forward_target_type AS ENUM ('single', 'group');
    END IF;
END$$;

-- Adiciona a coluna para determinar o tipo de encaminhamento na tabela de senhas
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS forward_type forward_target_type DEFAULT 'single';

-- Remove o índice antigo de encaminhamento único
DROP INDEX IF EXISTS idx_tickets_unique_forward;

-- Recria o índice para considerar o forward_type, garantindo que encaminhamentos 
-- individuais não conflitem acidentalmente com grupos de mesmo nome.
CREATE UNIQUE INDEX idx_tickets_unique_forward 
ON tickets(ticket_number, (created_at::date), location_id, COALESCE(forward_type::text, ''), COALESCE(forwarded_to, ''));

COMMIT;
