-- 029_refactor_guiche_to_fk.sql

-- Se o location_id foi adicionado anteriormente (pela 028), podemos remover
ALTER TABLE users DROP COLUMN IF EXISTS location_id;

-- Tabela USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS ticket_window_id INTEGER REFERENCES ticket_windows(id) ON DELETE SET NULL;
ALTER TABLE users DROP COLUMN IF EXISTS guiche;

-- Tabela TICKETS
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_window_id INTEGER REFERENCES ticket_windows(id) ON DELETE SET NULL;
ALTER TABLE tickets DROP COLUMN IF EXISTS guiche;

-- Atualizar Views se necessário (caso o sistema possua views complexas)
