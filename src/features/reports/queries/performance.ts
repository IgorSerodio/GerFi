import { pool } from "@/infra/database";
import { QueryParam } from "./base";

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
export async function getPerformanceData(
  startDate: Date,
  endDate: Date,
  locationId: number | "all",
  attendants: string[]
): Promise<PerformanceRow[]> {
  let baseFilter = "t.created_at BETWEEN $1 AND $2";
  const params: QueryParam[] = [startDate, endDate];

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND t.attendant = ANY($${params.length})`;
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
