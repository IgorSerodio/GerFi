-- 016_add_locations.sql

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir local principal com id = 0, caso não exista
INSERT INTO locations (id, name) VALUES (0, 'Principal') ON CONFLICT DO NOTHING;

-- Adicionar location_id nas tabelas existentes e atualizar as já existentes para 0
ALTER TABLE ticket_windows ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) DEFAULT 0;
ALTER TABLE tv_settings ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) DEFAULT 0;

-- Atualizar ticket_windows unique constraint
ALTER TABLE ticket_windows DROP CONSTRAINT IF EXISTS ticket_windows_name_key;
ALTER TABLE ticket_windows DROP CONSTRAINT IF EXISTS ticket_windows_location_name_key;
ALTER TABLE ticket_windows ADD CONSTRAINT ticket_windows_location_name_key UNIQUE (location_id, name);
