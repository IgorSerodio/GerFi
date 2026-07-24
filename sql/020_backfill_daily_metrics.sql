-- 020_backfill_daily_metrics.sql
-- Preenche a tabela daily_ticket_metrics com os dados históricos existentes na tabela tickets.

INSERT INTO daily_ticket_metrics (
  date, location_id, category_id, attendant, total_generated, total_completed, total_no_show, sum_wait_seconds, sum_service_seconds
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
  created_at::date,
  location_id,
  category_id,
  COALESCE(attendant, 'Não Atribuído'),
  COUNT(*) as total_generated,
  COUNT(CASE WHEN effective_status = 'completed' THEN 1 END) as total_completed,
  COUNT(CASE WHEN effective_status = 'no_show' THEN 1 END) as total_no_show,
  COALESCE(SUM(CASE WHEN effective_status = 'completed' THEN chain_wait_seconds ELSE 0 END), 0)::INTEGER as sum_wait_seconds,
  COALESCE(SUM(CASE WHEN effective_status = 'completed' THEN chain_service_seconds ELSE 0 END), 0)::INTEGER as sum_service_seconds
FROM filtered_tickets
GROUP BY created_at::date, location_id, category_id, COALESCE(attendant, 'Não Atribuído')
ON CONFLICT (date, location_id, category_id, attendant) DO UPDATE SET
  total_generated = EXCLUDED.total_generated,
  total_completed = EXCLUDED.total_completed,
  total_no_show = EXCLUDED.total_no_show,
  sum_wait_seconds = EXCLUDED.sum_wait_seconds,
  sum_service_seconds = EXCLUDED.sum_service_seconds;
