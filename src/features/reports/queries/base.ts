
export type QueryParam = string | number | Date | null | string[];

export interface ReportFiltersDTO {
  startDate: Date | null;
  endDate: Date | null;
  service?: string;
  locationId: number | "all";
  attendants: string[];
  subcategories?: string[];
}

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
      LEFT JOIN users u ON t.attendant_id = u.id
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

/**
 * Cria o fragmento SQL para filtro via JSONB de resoluções (subcategorias)
 */
export function buildSubcategoryFilter(paramIndex: number): string {
  return `EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(resolutions) AS r 
    WHERE r = ANY($${paramIndex})
  )`;
}

export interface EvolutionPoint {
  time: string;
  total: number;
  avg: number;
  wait: number;
}

