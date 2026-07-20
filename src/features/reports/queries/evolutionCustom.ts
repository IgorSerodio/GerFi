import { pool } from "@/infra/database";
import { QueryParam, ChartPoint, getFilteredTicketsCTE, EvolutionPoint } from "./base";

export async function getEvolutionSeries(startDate: Date, endDate: Date, serviceId: string, locationId: number | "all", attendants: string[]): Promise<EvolutionPoint[]> {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  let groupBy = "date_trunc('hour', original_created_at)";
  let dateFormat = "HH24:MI";
  if (diffDays > 2) {
    groupBy = "date_trunc('day', original_created_at)";
    dateFormat = "DD/MM";
  }

  let baseFilter = "t.created_at BETWEEN $1 AND $2";
  const params: QueryParam[] = [startDate, endDate];

  if (serviceId !== "all") {
    params.push(parseInt(serviceId, 10));
    baseFilter += ` AND t.category_id = $${params.length}`;
  }
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
      to_char(${groupBy}, '${dateFormat}') as time_label,
      COUNT(id) as total_count,
      COALESCE(AVG(chain_service_seconds) / 60, 0) as avg_duration,
      COALESCE(AVG(chain_wait_seconds) / 60, 0) as avg_wait
    FROM filtered_tickets
    GROUP BY ${groupBy}
    ORDER BY ${groupBy}
  `;

  const { rows } = await pool.query(queryStr, params);
  return rows.map((row) => ({
    time: row.time_label,
    total: parseInt(row.total_count, 10),
    avg: Math.round(parseFloat(row.avg_duration)),
    wait: Math.round(parseFloat(row.avg_wait)),
  }));
}

export async function getPeakHours(startDate: Date, endDate: Date, serviceId: string, locationId: number | "all", attendants: string[]): Promise<EvolutionPoint[]> {
  let baseFilter = "t.created_at BETWEEN $1 AND $2";
  const params: QueryParam[] = [startDate, endDate];

  if (serviceId !== "all") {
    params.push(parseInt(serviceId, 10));
    baseFilter += ` AND t.category_id = $${params.length}`;
  }
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
      LPAD(EXTRACT(HOUR FROM original_created_at)::text, 2, '0') || ':00' as time_label,
      COUNT(id) as total_count,
      COALESCE(AVG(chain_wait_seconds) / 60, 0) as avg_wait
    FROM filtered_tickets
    GROUP BY EXTRACT(HOUR FROM original_created_at)
    ORDER BY EXTRACT(HOUR FROM original_created_at)
  `;

  const { rows } = await pool.query(queryStr, params);
  return rows.map((row) => ({
    time: row.time_label,
    total: parseInt(row.total_count, 10),
    avg: 0,
    wait: Math.round(parseFloat(row.avg_wait)),
  }));
}

export async function getBusyDays(startDate: Date, endDate: Date, serviceId: string, locationId: number | "all", attendants: string[]): Promise<ChartPoint[]> {
  let baseFilter = "t.created_at BETWEEN $1 AND $2";
  const params: QueryParam[] = [startDate, endDate];

  if (serviceId !== "all") {
    params.push(parseInt(serviceId, 10));
    baseFilter += ` AND t.category_id = $${params.length}`;
  }
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
      EXTRACT(ISODOW FROM original_created_at) as dow,
      COUNT(id) as total_count
    FROM filtered_tickets
    GROUP BY EXTRACT(ISODOW FROM original_created_at)
    ORDER BY EXTRACT(ISODOW FROM original_created_at)
  `;

  const { rows } = await pool.query(queryStr, params);
  
  const map: Record<number, string> = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom' };
  return rows.map((row) => ({
    name: map[parseInt(row.dow, 10)] || 'N/A',
    value: parseInt(row.total_count, 10),
  }));
}
