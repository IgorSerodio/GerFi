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
export async function getCategoryRanking(startDate: Date | null, endDate: Date | null, locationId: number | "all", attendants: string[]): Promise<CategoryRank[]> {
  let baseFilter = "1=1";
  const params: QueryParam[] = [];

  if (startDate && endDate) {
    params.push(startDate, endDate);
    baseFilter += ` AND m.date BETWEEN $${params.length - 1} AND $${params.length}`;
  } else if (startDate) {
    params.push(startDate);
    baseFilter += ` AND m.date >= $${params.length}`;
  } else if (endDate) {
    params.push(endDate);
    baseFilter += ` AND m.date <= $${params.length}`;
  }

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND m.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND m.attendant = ANY($${params.length})`;
  }

  const finalQuery = `
    WITH total_tickets AS (SELECT COALESCE(SUM(total_generated), 0) as total FROM daily_ticket_metrics m WHERE ${baseFilter})
    SELECT 
      c.name,
      SUM(m.total_generated) as count,
      COALESCE((SUM(m.total_generated) * 100.0) / NULLIF((SELECT total FROM total_tickets), 0), 0) as percentage
    FROM daily_ticket_metrics m
    JOIN categories c ON m.category_id = c.id
    WHERE ${baseFilter}
    GROUP BY c.name
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
export async function getAttendantRanking(startDate: Date | null, endDate: Date | null, locationId: number | "all", attendants: string[]): Promise<AttendantRank[]> {
  let baseFilter = "m.attendant != 'Não Atribuído'";
  const params: QueryParam[] = [];

  if (startDate && endDate) {
    params.push(startDate, endDate);
    baseFilter += ` AND m.date BETWEEN $${params.length - 1} AND $${params.length}`;
  } else if (startDate) {
    params.push(startDate);
    baseFilter += ` AND m.date >= $${params.length}`;
  } else if (endDate) {
    params.push(endDate);
    baseFilter += ` AND m.date <= $${params.length}`;
  }

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND m.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND m.attendant = ANY($${params.length})`;
  }

  const queryStr = `
    SELECT 
      m.attendant as name,
      SUM(m.total_completed) as count,
      COALESCE(SUM(m.sum_service_seconds) / NULLIF(SUM(m.total_completed), 0) / 60, 0) as avg_duration
    FROM daily_ticket_metrics m
    WHERE ${baseFilter}
    GROUP BY m.attendant
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

export async function getCategoryAvgDuration(startDate: Date | null, endDate: Date | null, locationId: number | "all", attendants: string[]): Promise<ChartPoint[]> {
  let baseFilter = "1=1";
  const params: QueryParam[] = [];

  if (startDate && endDate) {
    params.push(startDate, endDate);
    baseFilter += ` AND m.date BETWEEN $${params.length - 1} AND $${params.length}`;
  } else if (startDate) {
    params.push(startDate);
    baseFilter += ` AND m.date >= $${params.length}`;
  } else if (endDate) {
    params.push(endDate);
    baseFilter += ` AND m.date <= $${params.length}`;
  }

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND m.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND m.attendant = ANY($${params.length})`;
  }

  const queryStr = `
    SELECT 
      c.name,
      COALESCE(SUM(m.sum_service_seconds) / NULLIF(SUM(m.total_completed), 0) / 60, 0) as avg_duration
    FROM daily_ticket_metrics m
    JOIN categories c ON m.category_id = c.id
    WHERE ${baseFilter}
    GROUP BY c.name
    ORDER BY avg_duration DESC
    LIMIT 5
  `;

  const { rows } = await pool.query(queryStr, params);

  return rows.map((row) => ({
    name: row.name || 'Desconhecido',
    value: Math.round(parseFloat(row.avg_duration)),
  }));
}
