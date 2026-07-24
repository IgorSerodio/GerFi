import { pool } from "@/infra/database";
import { QueryParam, ChartPoint, getFilteredTicketsCTE, EvolutionPoint } from "./base";

export async function getEvolutionSeries(startDate: Date | null, endDate: Date | null, serviceId: string, locationId: number | "all", attendants: string[]): Promise<EvolutionPoint[]> {
  const diffDays = (startDate && endDate) ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) : 999;
  
  if (diffDays <= 2) {
    // For small periods, use hourly aggregation via raw tickets table
    let baseFilter = "1=1";
    const params: QueryParam[] = [];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      baseFilter += ` AND t.created_at BETWEEN $${params.length - 1} AND $${params.length}`;
    } else if (startDate) {
      params.push(startDate);
      baseFilter += ` AND t.created_at >= $${params.length}`;
    } else if (endDate) {
      params.push(endDate);
      baseFilter += ` AND t.created_at <= $${params.length}`;
    }

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
        to_char(date_trunc('hour', original_created_at), 'HH24:MI') as time_label,
        COUNT(id) as total_count,
        COALESCE(AVG(chain_service_seconds) / 60, 0) as avg_duration,
        COALESCE(AVG(chain_wait_seconds) / 60, 0) as avg_wait
      FROM filtered_tickets
      GROUP BY date_trunc('hour', original_created_at)
      ORDER BY date_trunc('hour', original_created_at)
    `;

    const { rows } = await pool.query(queryStr, params);
    return rows.map((row) => ({
      time: row.time_label,
      total: parseInt(row.total_count, 10),
      avg: Math.round(parseFloat(row.avg_duration)),
      wait: Math.round(parseFloat(row.avg_wait)),
    }));
  }

  // For larger periods, use daily_ticket_metrics table
  let groupBy = "date_trunc('day', m.date)";
  let dateFormat = "DD/MM";

  if (diffDays > 365) {
    groupBy = "date_trunc('month', m.date)";
    dateFormat = "MM/YYYY";
  } else if (diffDays > 90) {
    groupBy = "date_trunc('week', m.date)";
    dateFormat = "DD/MM";
  }

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

  if (serviceId !== "all") {
    params.push(parseInt(serviceId, 10));
    baseFilter += ` AND m.category_id = $${params.length}`;
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
      to_char(${groupBy}, '${dateFormat}') as time_label,
      SUM(m.total_generated) as total_count,
      COALESCE(SUM(m.sum_service_seconds) / NULLIF(SUM(m.total_completed), 0) / 60, 0) as avg_duration,
      COALESCE(SUM(m.sum_wait_seconds) / NULLIF(SUM(m.total_completed), 0) / 60, 0) as avg_wait
    FROM daily_ticket_metrics m
    WHERE ${baseFilter}
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

export async function getPeakHours(startDate: Date | null, endDate: Date | null, serviceId: string, locationId: number | "all", attendants: string[]): Promise<EvolutionPoint[]> {
  let baseFilter = "1=1";
  const params: QueryParam[] = [];

  if (startDate && endDate) {
    params.push(startDate, endDate);
    baseFilter += ` AND t.created_at BETWEEN $${params.length - 1} AND $${params.length}`;
  } else if (startDate) {
    params.push(startDate);
    baseFilter += ` AND t.created_at >= $${params.length}`;
  } else if (endDate) {
    params.push(endDate);
    baseFilter += ` AND t.created_at <= $${params.length}`;
  }

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

export async function getBusyDays(startDate: Date | null, endDate: Date | null, serviceId: string, locationId: number | "all", attendants: string[]): Promise<ChartPoint[]> {
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

  if (serviceId !== "all") {
    params.push(parseInt(serviceId, 10));
    baseFilter += ` AND m.category_id = $${params.length}`;
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
      EXTRACT(ISODOW FROM m.date) as dow,
      SUM(m.total_generated) as total_count
    FROM daily_ticket_metrics m
    WHERE ${baseFilter}
    GROUP BY EXTRACT(ISODOW FROM m.date)
    ORDER BY EXTRACT(ISODOW FROM m.date)
  `;

  const { rows } = await pool.query(queryStr, params);
  
  const map: Record<number, string> = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom' };
  return rows.map((row) => ({
    name: map[parseInt(row.dow, 10)] || 'N/A',
    value: parseInt(row.total_count, 10),
  }));
}
