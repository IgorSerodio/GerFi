
export type QueryParam = string | number | Date | string[];

export interface ChartPoint {
  name: string;
  value: number;
}

/**
 * Helper para aplicar filtro anti-duplicação de encaminhamentos
 */
export function getFilteredTicketsCTE(baseFilter: string): string {
  return `
    base_filtered AS (
      SELECT t.*
      FROM tickets t
      WHERE ${baseFilter}
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
             ) as chain_service_seconds,
             (
               SELECT SUM(EXTRACT(EPOCH FROM (started_at - called_at)))
               FROM base_filtered f
               WHERE f.ticket_number = b.ticket_number 
                 AND f.created_at::date = b.created_at::date
             ) as chain_call_seconds,
             (
               SELECT MIN(created_at) FROM base_filtered f 
               WHERE f.ticket_number = b.ticket_number 
                 AND f.created_at::date = b.created_at::date
             ) as original_created_at
      FROM base_filtered b
      WHERE NOT (
        b.status = 'forwarded' AND EXISTS (
          SELECT 1 FROM base_filtered c 
          WHERE c.ticket_number = b.ticket_number 
            AND c.created_at::date = b.created_at::date
            AND c.created_at > b.created_at
        )
      )
    )`;
}

export interface EvolutionPoint {
  time: string;
  total: number;
  avg: number;
  wait: number;
}

