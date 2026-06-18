-- 001_init.sql
-- Initial database schema for GerFi (Queue Management System - SEFAZ)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'Atendente', 'Gerente', 'Triador', 'Admin'
  guiche VARCHAR(50),
  matricula VARCHAR(50) UNIQUE NOT NULL,
  cpf VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  services TEXT[] DEFAULT '{}'::text[],
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(20) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL, -- 'Normal', 'Prioritário'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'calling', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  called_at TIMESTAMP,
  completed_at TIMESTAMP,
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


