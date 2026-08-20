-- 029_refactor_guiche_to_fk.sql

-- Tabela USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS ticket_window_id INTEGER REFERENCES ticket_windows(id) ON DELETE SET NULL;

-- Tenta preencher o ticket_window_id baseado no guiche textual e no location_id 
-- (caso o location_id tenha sido recém-criado na migration 028)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'location_id') THEN
        UPDATE users u
        SET ticket_window_id = (
          SELECT tw.id FROM ticket_windows tw 
          WHERE tw.name = u.guiche 
            AND tw.location_id = COALESCE(u.location_id, 1)
          LIMIT 1
        )
        WHERE u.guiche IS NOT NULL AND u.guiche != '';
    ELSE
        UPDATE users u
        SET ticket_window_id = (
          SELECT tw.id FROM ticket_windows tw 
          WHERE tw.name = u.guiche 
          LIMIT 1
        )
        WHERE u.guiche IS NOT NULL AND u.guiche != '';
    END IF;
END $$;

-- Se o location_id foi adicionado temporariamente (pela 028), podemos remover agora que migramos
ALTER TABLE users DROP COLUMN IF EXISTS location_id;
ALTER TABLE users DROP COLUMN IF EXISTS guiche;

-- Tabela TICKETS
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_window_id INTEGER REFERENCES ticket_windows(id) ON DELETE SET NULL;

-- Preencher o ticket_window_id da tabela tickets usando o guiche e o location_id (já existente nela)
UPDATE tickets t
SET ticket_window_id = (
  SELECT tw.id FROM ticket_windows tw 
  WHERE tw.name = t.guiche 
    AND tw.location_id = COALESCE(t.location_id, 1)
  LIMIT 1
)
WHERE t.guiche IS NOT NULL AND t.guiche != '';

ALTER TABLE tickets DROP COLUMN IF EXISTS guiche;

-- Atualizar Views se necessário (caso o sistema possua views complexas)
