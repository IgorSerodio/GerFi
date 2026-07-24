-- 018_add_reports_indexes.sql
-- Adiciona índices compostos para acelerar consultas analíticas do relatório (timeline, performance e evolução)

CREATE INDEX IF NOT EXISTS idx_tickets_reports_performance 
ON tickets (created_at DESC, location_id, category_id, attendant);

CREATE INDEX IF NOT EXISTS idx_tickets_reports_evolution 
ON tickets ((created_at::date), category_id);

CREATE INDEX IF NOT EXISTS idx_tickets_reports_status 
ON tickets (status, created_at DESC);
