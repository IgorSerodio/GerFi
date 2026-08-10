import { pool } from "@/infra/database";
import { QueryParam, ReportFiltersDTO, buildSubcategoryFilter } from "./base";

export interface PerformanceRow {
  attendant: string;
  ticketsAnswered: number;
  avgWaitSeconds: number;
  avgCallSeconds: number;
  avgServiceSeconds: number;
  totalAvgSeconds: number;
}

/**
 * Obtém os dados de desempenho agregados por atendente.
 * As métricas calculam a quantidade de tickets atendidos (ou encaminhados)
 * e o tempo médio de espera, chamada e atendimento para cada atendente.
 */
export async function getPerformanceData(filters: ReportFiltersDTO): Promise<PerformanceRow[]> {
  let baseFilter = "t.attendant IS NULL OR t.attendant NOT IN (SELECT name FROM users WHERE role = 'admin')";
  const params: QueryParam[] = [];

  if (filters.startDate && filters.endDate) {
    params.push(filters.startDate, filters.endDate);
    baseFilter += ` AND t.created_at BETWEEN $${params.length - 1} AND $${params.length}`;
  } else if (filters.startDate) {
    params.push(filters.startDate);
    baseFilter += ` AND t.created_at >= $${params.length}`;
  } else if (filters.endDate) {
    params.push(filters.endDate);
    baseFilter += ` AND t.created_at <= $${params.length}`;
  }

  if (filters.service && filters.service !== "all") {
    params.push(parseInt(filters.service, 10));
    baseFilter += ` AND t.category_id = $${params.length}`;
  }
  if (filters.locationId !== "all") {
    params.push(filters.locationId);
    baseFilter += ` AND t.location_id = $${params.length}`;
  }
  if (filters.attendants && filters.attendants.length > 0) {
    params.push(filters.attendants);
    baseFilter += ` AND t.attendant = ANY($${params.length})`;
  }
  if (filters.subcategories && filters.subcategories.length > 0) {
    params.push(filters.subcategories);
    baseFilter += ` AND ${buildSubcategoryFilter(params.length)}`;
  }

  const queryStr = `
    SELECT 
      t.attendant as name,
      COUNT(t.id) as tickets_answered,
      COALESCE(AVG(EXTRACT(EPOCH FROM (t.called_at - t.created_at))), 0) as avg_wait_seconds,
      COALESCE(AVG(EXTRACT(EPOCH FROM (t.started_at - t.called_at))), 0) as avg_call_seconds,
      COALESCE(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.started_at))), 0) as avg_service_seconds
    FROM tickets t
    WHERE t.status IN ('completed', 'forwarded') AND t.attendant IS NOT NULL
      AND ${baseFilter}
    GROUP BY t.attendant
    ORDER BY tickets_answered DESC
  `;

  const { rows } = await pool.query(queryStr, params);

  return rows.map((row) => {
    const avgWaitSeconds = parseFloat(row.avg_wait_seconds);
    const avgCallSeconds = parseFloat(row.avg_call_seconds);
    const avgServiceSeconds = parseFloat(row.avg_service_seconds);

    return {
      attendant: row.name,
      ticketsAnswered: parseInt(row.tickets_answered, 10),
      avgWaitSeconds,
      avgCallSeconds,
      avgServiceSeconds,
      totalAvgSeconds: avgWaitSeconds + avgCallSeconds + avgServiceSeconds,
    };
  });
}
