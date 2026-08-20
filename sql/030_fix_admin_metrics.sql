-- 030_fix_admin_metrics.sql
-- Atualiza a trigger de métricas para mover o "total_generated" do atendente NULO (quando gerado)
-- para a conta do próprio atendente quando ele chama a senha. 
-- Isso permite que métricas filtradas por "role != Admin" consigam excluir corretamente as 
-- senhas que foram geradas para testes por Admins.

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
    -- Mover total_generated do NULL para o attendant quando o ticket for atendido (chamado)
    IF OLD.attendant_id IS NULL AND NEW.attendant_id IS NOT NULL THEN
      UPDATE daily_ticket_metrics 
      SET total_generated = GREATEST(0, total_generated - 1)
      WHERE date = NEW.created_at::date 
        AND location_id = NEW.location_id 
        AND category_id = NEW.category_id 
        AND attendant_id IS NULL;
        
      INSERT INTO daily_ticket_metrics (
        date, location_id, category_id, attendant_id, total_generated
      )
      VALUES (
        NEW.created_at::date, NEW.location_id, NEW.category_id, NEW.attendant_id, 1
      )
      ON CONFLICT (date, location_id, category_id, attendant_id)
      DO UPDATE SET total_generated = daily_ticket_metrics.total_generated + 1;
    END IF;

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

-- Corrige as estatísticas retroativamente
TRUNCATE TABLE daily_ticket_metrics;

INSERT INTO daily_ticket_metrics (
  date,
  location_id,
  category_id,
  attendant_id,
  total_generated,
  total_completed,
  total_no_show,
  sum_wait_seconds,
  sum_service_seconds
)
WITH base_filtered AS (
  SELECT t.*
  FROM tickets t
),
filtered_tickets AS (
  SELECT b.*,
         CASE 
           WHEN b.status = 'forwarded' THEN (
             SELECT status FROM tickets f 
             WHERE f.ticket_number = b.ticket_number 
               AND f.created_at::date = b.created_at::date
             ORDER BY created_at DESC LIMIT 1
           )
           ELSE b.status 
         END as effective_status,
         (
           SELECT SUM(EXTRACT(EPOCH FROM (called_at - created_at)))
           FROM base_filtered f
           WHERE f.ticket_number = b.ticket_number 
             AND f.created_at::date = b.created_at::date
         ) as chain_wait_seconds,
         (
           SELECT SUM(EXTRACT(EPOCH FROM (completed_at - started_at)))
           FROM base_filtered f
           WHERE f.ticket_number = b.ticket_number 
             AND f.created_at::date = b.created_at::date
         ) as chain_service_seconds
  FROM base_filtered b
  WHERE NOT (
    b.status = 'forwarded' AND EXISTS (
      SELECT 1 FROM base_filtered c 
      WHERE c.ticket_number = b.ticket_number 
        AND c.created_at::date = b.created_at::date
        AND c.created_at > b.created_at
    )
  )
)
SELECT 
  created_at::date as date,
  location_id,
  category_id,
  attendant_id, 
  COUNT(*) as total_generated,
  COUNT(CASE WHEN effective_status = 'completed' THEN 1 END) as total_completed,
  COUNT(CASE WHEN effective_status = 'no_show' THEN 1 END) as total_no_show,
  COALESCE(SUM(CASE WHEN effective_status = 'completed' THEN chain_wait_seconds ELSE 0 END), 0)::INTEGER as sum_wait_seconds,
  COALESCE(SUM(CASE WHEN effective_status = 'completed' THEN chain_service_seconds ELSE 0 END), 0)::INTEGER as sum_service_seconds
FROM filtered_tickets
GROUP BY created_at::date, location_id, category_id, attendant_id
ON CONFLICT (date, location_id, category_id, attendant_id) DO UPDATE SET
  total_generated = EXCLUDED.total_generated,
  total_completed = EXCLUDED.total_completed,
  total_no_show = EXCLUDED.total_no_show,
  sum_wait_seconds = EXCLUDED.sum_wait_seconds,
  sum_service_seconds = EXCLUDED.sum_service_seconds;
