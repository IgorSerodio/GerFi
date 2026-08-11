-- 024_refactor_attendant_to_fk.sql

-- 1. Tabela TICKETS
ALTER TABLE tickets ADD COLUMN attendant_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Migra dados existentes de tickets onde o nome confere
UPDATE tickets t
SET attendant_id = u.id
FROM users u
WHERE t.attendant = u.name;

-- Cria um indice de performance para facilitar busca por attendant_id (substituindo o antigo q usava attendant texto)
DROP INDEX IF EXISTS idx_tickets_attendant;
CREATE INDEX IF NOT EXISTS idx_tickets_attendant_id ON tickets (attendant_id);

ALTER TABLE tickets DROP COLUMN attendant CASCADE;

-- Recria o índice composto analítico que foi apagado junto com a coluna
CREATE INDEX IF NOT EXISTS idx_tickets_reports_performance 
ON tickets (created_at DESC, location_id, category_id, attendant_id);


-- 2. Tabela DAILY_TICKET_METRICS
ALTER TABLE daily_ticket_metrics ADD COLUMN attendant_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Migra dados existentes de daily metrics
UPDATE daily_ticket_metrics d
SET attendant_id = u.id
FROM users u
WHERE d.attendant = u.name;

-- Para registros de 'Não Atribuído' ou usuários deletados, o attendant_id ficará nulo.
-- Precisamos fundir (merge) possíveis duplicatas de attendant_id = NULL para o mesmo dia/local/categoria 
-- antes de aplicar a restrição de unicidade.
UPDATE daily_ticket_metrics AS d
SET total_generated = sub.tg,
    total_completed = sub.tc,
    total_no_show = sub.tns,
    sum_wait_seconds = sub.sws,
    sum_service_seconds = sub.sss
FROM (
  SELECT date, location_id, category_id,
         SUM(total_generated) as tg, SUM(total_completed) as tc, SUM(total_no_show) as tns,
         SUM(sum_wait_seconds) as sws, SUM(sum_service_seconds) as sss,
         MIN(id) as keep_id
  FROM daily_ticket_metrics
  WHERE attendant_id IS NULL
  GROUP BY date, location_id, category_id
  HAVING COUNT(*) > 1
) sub
WHERE d.id = sub.keep_id;

DELETE FROM daily_ticket_metrics
WHERE attendant_id IS NULL
  AND id NOT IN (
    SELECT MIN(id)
    FROM daily_ticket_metrics
    WHERE attendant_id IS NULL
    GROUP BY date, location_id, category_id
  );

-- Removemos a constraint antiga e a coluna ANTES de criar o novo índice
ALTER TABLE daily_ticket_metrics DROP CONSTRAINT daily_ticket_metrics_date_location_id_category_id_attendant_key;
ALTER TABLE daily_ticket_metrics DROP COLUMN attendant;

-- Cria a restrição moderna permitindo NULLs como idênticos para agrupamento
ALTER TABLE daily_ticket_metrics ADD CONSTRAINT unique_daily_metrics UNIQUE NULLS NOT DISTINCT (date, location_id, category_id, attendant_id);


-- 3. Atualizar o Trigger (Removendo o COALESCE 'Não Atribuído' e passando o attendant_id diretamente)
CREATE OR REPLACE FUNCTION upsert_daily_ticket_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_chain_wait_seconds INTEGER := 0;
  v_chain_service_seconds INTEGER := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO daily_ticket_metrics (
      date, location_id, category_id, attendant_id, total_generated
    )
    VALUES (
      NEW.created_at::date, NEW.location_id, NEW.category_id, NEW.attendant_id, 1
    )
    ON CONFLICT (date, location_id, category_id, attendant_id)
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
        date, location_id, category_id, attendant_id, total_completed, sum_wait_seconds, sum_service_seconds
      )
      VALUES (
        NEW.created_at::date, NEW.location_id, NEW.category_id, NEW.attendant_id, 1, v_chain_wait_seconds, v_chain_service_seconds
      )
      ON CONFLICT (date, location_id, category_id, attendant_id)
      DO UPDATE SET 
        total_completed = daily_ticket_metrics.total_completed + 1,
        sum_wait_seconds = daily_ticket_metrics.sum_wait_seconds + EXCLUDED.sum_wait_seconds,
        sum_service_seconds = daily_ticket_metrics.sum_service_seconds + EXCLUDED.sum_service_seconds;
        
    ELSIF NEW.status = 'no_show' AND (OLD.status IS DISTINCT FROM 'no_show') THEN
      INSERT INTO daily_ticket_metrics (
        date, location_id, category_id, attendant_id, total_no_show
      )
      VALUES (
        NEW.created_at::date, NEW.location_id, NEW.category_id, NEW.attendant_id, 1
      )
      ON CONFLICT (date, location_id, category_id, attendant_id)
      DO UPDATE SET total_no_show = daily_ticket_metrics.total_no_show + 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
