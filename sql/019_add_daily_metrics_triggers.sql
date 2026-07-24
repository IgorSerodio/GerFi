-- 019_add_daily_metrics_triggers.sql
-- Tabela de agregação incremental e triggers para pré-calcular métricas diárias

CREATE TABLE IF NOT EXISTS daily_ticket_metrics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  location_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  attendant VARCHAR(100) NOT NULL,
  total_generated INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_no_show INTEGER DEFAULT 0,
  sum_wait_seconds INTEGER DEFAULT 0,
  sum_service_seconds INTEGER DEFAULT 0,
  UNIQUE (date, location_id, category_id, attendant)
);

CREATE OR REPLACE FUNCTION upsert_daily_ticket_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_chain_wait_seconds INTEGER := 0;
  v_chain_service_seconds INTEGER := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO daily_ticket_metrics (
      date, location_id, category_id, attendant, total_generated
    )
    VALUES (
      NEW.created_at::date, NEW.location_id, NEW.category_id, COALESCE(NEW.attendant, 'Não Atribuído'), 1
    )
    ON CONFLICT (date, location_id, category_id, attendant)
    DO UPDATE SET total_generated = daily_ticket_metrics.total_generated + 1;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
      SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM (called_at - created_at)))::INTEGER, 0),
        COALESCE(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)))::INTEGER, 0)
      INTO v_chain_wait_seconds, v_chain_service_seconds
      FROM tickets
      WHERE ticket_number = NEW.ticket_number 
        AND created_at::date = NEW.created_at::date;

      INSERT INTO daily_ticket_metrics (
        date, location_id, category_id, attendant, total_completed, sum_wait_seconds, sum_service_seconds
      )
      VALUES (
        NEW.created_at::date, NEW.location_id, NEW.category_id, COALESCE(NEW.attendant, 'Não Atribuído'), 1, v_chain_wait_seconds, v_chain_service_seconds
      )
      ON CONFLICT (date, location_id, category_id, attendant)
      DO UPDATE SET 
        total_completed = daily_ticket_metrics.total_completed + 1,
        sum_wait_seconds = daily_ticket_metrics.sum_wait_seconds + EXCLUDED.sum_wait_seconds,
        sum_service_seconds = daily_ticket_metrics.sum_service_seconds + EXCLUDED.sum_service_seconds;
        
    ELSIF NEW.status = 'no_show' AND (OLD.status IS DISTINCT FROM 'no_show') THEN
      INSERT INTO daily_ticket_metrics (
        date, location_id, category_id, attendant, total_no_show
      )
      VALUES (
        NEW.created_at::date, NEW.location_id, NEW.category_id, COALESCE(NEW.attendant, 'Não Atribuído'), 1
      )
      ON CONFLICT (date, location_id, category_id, attendant)
      DO UPDATE SET total_no_show = daily_ticket_metrics.total_no_show + 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_metrics_trigger ON tickets;
CREATE TRIGGER ticket_metrics_trigger
AFTER INSERT OR UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION upsert_daily_ticket_metrics();
