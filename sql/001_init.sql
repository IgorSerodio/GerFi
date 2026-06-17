-- 001_init.sql
-- Initial database schema for GerFi (Queue Management System - SEFAZ)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'Atendente', 'Gerente', 'Triador', 'Admin'
  guiche VARCHAR(50) NOT NULL,
  matricula VARCHAR(50) UNIQUE NOT NULL,
  cpf VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  services TEXT[] DEFAULT '{}'::text[],
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(20) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL, -- 'Normal', 'Prioritário'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'calling', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  called_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attendant VARCHAR(100),
  guiche VARCHAR(50),
  observation TEXT
);

-- TV Settings Table
CREATE TABLE IF NOT EXISTS tv_settings (
  id SERIAL PRIMARY KEY,
  mode VARCHAR(20) NOT NULL DEFAULT 'live', -- 'live', 'files'
  live_url TEXT NOT NULL DEFAULT 'https://www.youtube.com/embed/live_stream?channel=UC77X3Z_78d52S9T3Z_V5-0w',
  uploaded_files JSONB DEFAULT '[]'::jsonb
);

-- Indexing for optimized queue lookups
CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON tickets (status, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_created_date ON tickets ((created_at::date));

-- Trigger function for Postgres LISTEN/NOTIFY real-time queue synchronization
CREATE OR REPLACE FUNCTION notify_queue_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('queue_change', 'update');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger attaching to tickets table
CREATE OR REPLACE TRIGGER queue_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON tickets
FOR EACH ROW EXECUTE FUNCTION notify_queue_change();

-- Seed Default TV Settings
INSERT INTO tv_settings (id, mode, live_url, uploaded_files)
VALUES (1, 'live', 'https://www.youtube.com/embed/live_stream?channel=UC77X3Z_78d52S9T3Z_V5-0w', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Users
-- admin / admin
INSERT INTO users (name, role, guiche, matricula, cpf, email, username, password, services, blocked)
VALUES ('Administrador GerFi', 'Admin', '-', '00000', '000.000.000-00', 'admin@caruaru.pe.gov.br', 'admin', '$2b$10$4flj/NvC4iuUKyKl9w1fceUUEA06zD8HsSNvGW6g6f6oL85pXq6Xa', '{}'::text[], FALSE)
ON CONFLICT (matricula) DO NOTHING;

-- Carlos Andrade / password123
INSERT INTO users (name, role, guiche, matricula, cpf, email, username, password, services, blocked)
VALUES ('Carlos Andrade', 'Atendente', 'Guichê 03', '12345', '111.222.333-44', 'carlos@caruaru.pe.gov.br', 'carlos.andrade', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"IPTU", "ITBI"}'::text[], FALSE)
ON CONFLICT (matricula) DO NOTHING;

-- Maria Silva / password456
INSERT INTO users (name, role, guiche, matricula, cpf, email, username, password, services, blocked)
VALUES ('Maria Silva', 'Atendente', 'Guichê 01', '67890', '555.666.777-88', 'maria@caruaru.pe.gov.br', 'maria.silva', '$2b$10$415KLHG7K2PE26DP7SgqweSzVvfbi9pedlAa23CX1SfkrdoamoWAe', '{"TAXI", "2VIA"}'::text[], FALSE)
ON CONFLICT (matricula) DO NOTHING;

-- João Pereira / password789
INSERT INTO users (name, role, guiche, matricula, cpf, email, username, password, services, blocked)
VALUES ('João Pereira', 'Gerente', '-', '11223', '999.888.777-66', 'joao@caruaru.pe.gov.br', 'joao.pereira', '$2b$10$rpMd.sSMF356jZHbEM5OfukbS.RVGRsn9SdrHMrX4FsEMOySVYbmm', '{}'::text[], FALSE)
ON CONFLICT (matricula) DO NOTHING;

-- Other Attendants (default password: password123)
INSERT INTO users (name, role, guiche, matricula, cpf, email, username, password, services, blocked)
VALUES 
('Brandon Ollyver Paulo de Oliveira', 'Atendente', 'Guichê 01', '10001', '000.000.000-01', 'brandon@caruaru.pe.gov.br', 'brandon.oliveira', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"IPTU"}'::text[], FALSE),
('Cícera M. Rodrigues Fagundes', 'Atendente', 'Guichê 02', '10002', '000.000.000-02', 'cicera@caruaru.pe.gov.br', 'cicera.fagundes', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"ITBI"}'::text[], FALSE),
('Eduarda Lima', 'Atendente', 'Guichê 03', '10003', '000.000.000-03', 'eduarda@caruaru.pe.gov.br', 'eduarda.lima', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"TAXI"}'::text[], FALSE),
('Eduardo Henrique Barboza de Mello', 'Atendente', 'Guichê 04', '10004', '000.000.000-04', 'eduardo@caruaru.pe.gov.br', 'eduardo.mello', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"2VIA"}'::text[], FALSE),
('Emilly Bernardino Dantas Silva', 'Atendente', 'Guichê 05', '10005', '000.000.000-05', 'emilly@caruaru.pe.gov.br', 'emilly.silva', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"DEMAIS"}'::text[], FALSE),
('Gabriela Melo', 'Atendente', 'Guichê 06', '10006', '000.000.000-06', 'gabriela@caruaru.pe.gov.br', 'gabriela.melo', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"IPTU"}'::text[], FALSE),
('Gecival Gecival', 'Atendente', 'Guichê 07', '10007', '000.000.000-07', 'gecival@caruaru.pe.gov.br', 'gecival', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"ITBI"}'::text[], FALSE),
('Ingrid Vanessa de Lima Figueiredo Nunes', 'Atendente', 'Guichê 08', '10008', '000.000.000-08', 'ingrid@caruaru.pe.gov.br', 'ingrid.nunes', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"TAXI"}'::text[], FALSE),
('José Matheus Florêncio', 'Atendente', 'Guichê 09', '10009', '000.000.000-09', 'jose@caruaru.pe.gov.br', 'matheus.florencio', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"2VIA"}'::text[], FALSE),
('Juçara Ferreira de Moura', 'Atendente', 'Guichê 10', '10010', '000.000.000-10', 'jucara@caruaru.pe.gov.br', 'jucara.moura', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"DEMAIS"}'::text[], FALSE),
('Luma Jhessey Teixeira Araújo de Lucena', 'Atendente', 'Guichê 11', '10011', '000.000.000-11', 'luma@caruaru.pe.gov.br', 'luma.lucena', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"IPTU"}'::text[], FALSE),
('Margarida Maria F. Ramos', 'Atendente', 'Guichê 12', '10012', '000.000.000-12', 'margarida@caruaru.pe.gov.br', 'margarida.ramos', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"ITBI"}'::text[], FALSE),
('Maria Eduarda Silva Bezerra', 'Atendente', 'Guichê 13', '10013', '000.000.000-13', 'maria.eduarda@caruaru.pe.gov.br', 'maria.bezerra', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"TAXI"}'::text[], FALSE),
('Nara Laiane Barboza Santos', 'Atendente', 'Guichê 14', '10014', '000.000.000-14', 'nara@caruaru.pe.gov.br', 'nara.santos', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"2VIA"}'::text[], FALSE),
('Pedro Henrique Pequeno', 'Atendente', 'Guichê 15', '10015', '000.000.000-15', 'pedro@caruaru.pe.gov.br', 'pedro.pequeno', '$2b$10$Kxdi9LN46Uuyy1egp49HluUwZlxqsCJ2jFv6HjfrQexGU2HLQVSby', '{"DEMAIS"}'::text[], FALSE)
ON CONFLICT (matricula) DO NOTHING;
