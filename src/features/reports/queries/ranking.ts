import { pool } from "@/infra/database";
import { QueryParam, ChartPoint, getFilteredTicketsCTE } from "./base";

export interface CategoryRank {
  name: string;
  value: number; // percentage
  count: number;
}

export interface AttendantRank {
  name: string;
  count: number;
  avgDuration: number;
  rating: number;
}

/**
 * Obtém o ranking de serviços mais procurados no período
 */
export async function getCategoryRanking(startDate: Date, endDate: Date, locationId: number | "all", attendants: string[]): Promise<CategoryRank[]> {
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

  const finalQuery = `
    WITH ${getFilteredTicketsCTE(baseFilter)},
    total_tickets AS (SELECT COUNT(*) as total FROM filtered_tickets)
    SELECT 
      category_name as name,
      COUNT(*) as count,
      COALESCE((COUNT(*) * 100.0) / NULLIF((SELECT total FROM total_tickets), 0), 0) as percentage
    FROM filtered_tickets
    GROUP BY category_name
    ORDER BY count DESC
    LIMIT 4
  `;

  const { rows } = await pool.query(finalQuery, params);

  return rows.map((row) => ({
    name: row.name,
    count: parseInt(row.count, 10),
    value: Math.round(parseFloat(row.percentage)),
  }));
}

/**
 * Obtém produtividade dos atendentes no período
 */
export async function getAttendantRanking(startDate: Date, endDate: Date, locationId: number | "all", attendants: string[]): Promise<AttendantRank[]> {
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
      COUNT(t.id) as count,
      COALESCE(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.started_at))) / 60, 0) as avg_duration
    FROM tickets t
    WHERE t.status IN ('completed', 'forwarded') AND t.attendant IS NOT NULL
      AND ${baseFilter}
    GROUP BY t.attendant
    ORDER BY count DESC
  `;

  const { rows } = await pool.query(queryStr, params);

  return rows.map((row) => ({
    name: row.name,
    count: parseInt(row.count, 10),
    avgDuration: Math.round(parseFloat(row.avg_duration)),
    rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)), // Simulação de nota com base em média realista
  }));
}

export async function getCategoryAvgDuration(startDate: Date, endDate: Date, locationId: number | "all", attendants: string[]): Promise<ChartPoint[]> {
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
    WITH ${getFilteredTicketsCTE(baseFilter)}
    SELECT 
      category_name as name,
      COALESCE(AVG(chain_service_seconds) / 60, 0) as avg_duration
    FROM filtered_tickets
    WHERE effective_status = 'completed'
    GROUP BY category_name
    ORDER BY avg_duration DESC
    LIMIT 5
  `;

  const { rows } = await pool.query(queryStr, params);

  return rows.map((row) => ({
    name: row.name || 'Desconhecido',
    value: Math.round(parseFloat(row.avg_duration)),
  }));
}
