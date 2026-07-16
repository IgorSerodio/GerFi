import { pool } from "@/infra/database";
import { QueryParam, ChartPoint, getFilteredTicketsCTE } from "./base";

export async function getHourlyEvolutionToday(
  metric: "tickets" | "wait_time" | "atendimentos",
  locationId: number | "all",
  attendants: string[]
): Promise<ChartPoint[]> {
  let baseFilter = "t.created_at::date = CURRENT_DATE";
  const params: QueryParam[] = [];

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND t.attendant = ANY($${params.length})`;
  }

  const { rows } = await pool.query(
    `WITH ${getFilteredTicketsCTE(baseFilter)},
     hours AS (
       SELECT generate_series(
         date_trunc('day', CURRENT_TIMESTAMP) + interval '8 hours',
         date_trunc('day', CURRENT_TIMESTAMP) + interval '19 hours',
         interval '1 hour'
       ) AS hour_bucket
     )
     SELECT 
       to_char(h.hour_bucket, 'HH24:MI') as hour_name,
       COUNT(t.id) as ticket_count,
       COUNT(CASE WHEN t.effective_status = 'completed' THEN 1 END) as completed_count,
       COALESCE(AVG(t.chain_wait_seconds) / 60, 0) as avg_wait_min
     FROM hours h
     LEFT JOIN filtered_tickets t ON 
       t.original_created_at >= h.hour_bucket AND 
       t.original_created_at < h.hour_bucket + interval '1 hour'
     GROUP BY h.hour_bucket
     ORDER BY h.hour_bucket`,
     params
  );

  return rows.map((row) => {
    let value = 0;
    if (metric === "tickets") value = parseInt(row.ticket_count, 10);
    else if (metric === "atendimentos") value = parseInt(row.completed_count, 10);
    else value = Math.round(parseFloat(row.avg_wait_min));

    return {
      name: row.hour_name,
      value,
    };
  });
}

export async function getWeeklyEvolution(
  metric: "tickets" | "wait_time" | "atendimentos",
  locationId: number | "all",
  attendants: string[]
): Promise<ChartPoint[]> {
  let baseFilter = "t.created_at >= date_trunc('week', CURRENT_DATE) AND t.created_at < date_trunc('week', CURRENT_DATE) + interval '7 days'";
  const params: QueryParam[] = [];

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND t.attendant = ANY($${params.length})`;
  }

  const { rows } = await pool.query(
    `WITH ${getFilteredTicketsCTE(baseFilter)},
     days AS (
       SELECT generate_series(
         date_trunc('week', CURRENT_DATE),
         date_trunc('week', CURRENT_DATE) + interval '6 days',
         interval '1 day'
       ) AS day_bucket
     )
     SELECT 
       CASE EXTRACT(ISODOW FROM d.day_bucket)
         WHEN 1 THEN 'Seg'
         WHEN 2 THEN 'Ter'
         WHEN 3 THEN 'Qua'
         WHEN 4 THEN 'Qui'
         WHEN 5 THEN 'Sex'
         WHEN 6 THEN 'Sáb'
         WHEN 7 THEN 'Dom'
       END as day_name,
       d.day_bucket,
       COUNT(t.id) as ticket_count,
       COUNT(CASE WHEN t.effective_status = 'completed' THEN 1 END) as completed_count,
       COALESCE(AVG(t.chain_wait_seconds) / 60, 0) as avg_wait_min
     FROM days d
     LEFT JOIN filtered_tickets t ON t.original_created_at::date = d.day_bucket::date
     GROUP BY d.day_bucket
     ORDER BY d.day_bucket`,
     params
  );

  return rows.map((row) => {
    let value = 0;
    if (metric === "tickets") value = parseInt(row.ticket_count, 10);
    else if (metric === "atendimentos") value = parseInt(row.completed_count, 10);
    else value = Math.round(parseFloat(row.avg_wait_min));

    return {
      name: row.day_name,
      value,
    };
  });
}

export interface EvolutionPoint {
  time: string;
  total: number;
  avg: number;
  wait: number;
}

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

export async function getMonthlyEvolution(
  metric: "tickets" | "wait_time" | "atendimentos",
  locationId: number | "all",
  attendants: string[]
): Promise<ChartPoint[]> {
  let baseFilter = "t.created_at >= date_trunc('month', CURRENT_DATE) AND t.created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'";
  const params: QueryParam[] = [];

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND t.attendant = ANY($${params.length})`;
  }

  const { rows } = await pool.query(
    `WITH ${getFilteredTicketsCTE(baseFilter)},
     days AS (
       SELECT generate_series(
         date_trunc('month', CURRENT_DATE),
         date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day',
         interval '1 day'
       ) AS day_bucket
     )
     SELECT 
       to_char(d.day_bucket, 'DD/MM') as day_name,
       COUNT(t.id) as ticket_count,
       COUNT(CASE WHEN t.effective_status = 'completed' THEN 1 END) as completed_count,
       COALESCE(AVG(t.chain_wait_seconds) / 60, 0) as avg_wait_min
     FROM days d
     LEFT JOIN filtered_tickets t ON t.original_created_at::date = d.day_bucket::date
     GROUP BY d.day_bucket
     ORDER BY d.day_bucket`,
     params
  );

  return rows.map((row) => {
    let value = 0;
    if (metric === "tickets") value = parseInt(row.ticket_count, 10);
    else if (metric === "atendimentos") value = parseInt(row.completed_count, 10);
    else value = Math.round(parseFloat(row.avg_wait_min));

    return {
      name: row.day_name,
      value,
    };
  });
}

export async function getYearlyEvolution(
  metric: "tickets" | "wait_time" | "atendimentos",
  locationId: number | "all",
  attendants: string[]
): Promise<ChartPoint[]> {
  let baseFilter = "t.created_at >= date_trunc('year', CURRENT_DATE) AND t.created_at < date_trunc('year', CURRENT_DATE) + interval '1 year'";
  const params: QueryParam[] = [];

  if (locationId !== "all") {
    params.push(locationId);
    baseFilter += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    baseFilter += ` AND t.attendant = ANY($${params.length})`;
  }

  const { rows } = await pool.query(
    `WITH ${getFilteredTicketsCTE(baseFilter)},
     months AS (
       SELECT generate_series(
         date_trunc('year', CURRENT_DATE),
         date_trunc('year', CURRENT_DATE) + interval '11 months',
         interval '1 month'
       ) AS month_bucket
     )
     SELECT 
       CASE EXTRACT(MONTH FROM m.month_bucket)
         WHEN 1 THEN 'Jan'
         WHEN 2 THEN 'Fev'
         WHEN 3 THEN 'Mar'
         WHEN 4 THEN 'Abr'
         WHEN 5 THEN 'Mai'
         WHEN 6 THEN 'Jun'
         WHEN 7 THEN 'Jul'
         WHEN 8 THEN 'Ago'
         WHEN 9 THEN 'Set'
         WHEN 10 THEN 'Out'
         WHEN 11 THEN 'Nov'
         WHEN 12 THEN 'Dez'
       END as month_name,
       m.month_bucket,
       COUNT(t.id) as ticket_count,
       COUNT(CASE WHEN t.effective_status = 'completed' THEN 1 END) as completed_count,
       COALESCE(AVG(t.chain_wait_seconds) / 60, 0) as avg_wait_min
     FROM months m
     LEFT JOIN filtered_tickets t ON date_trunc('month', t.original_created_at) = m.month_bucket
     GROUP BY m.month_bucket
     ORDER BY m.month_bucket`,
     params
  );

  return rows.map((row) => {
    let value = 0;
    if (metric === "tickets") value = parseInt(row.ticket_count, 10);
    else if (metric === "atendimentos") value = parseInt(row.completed_count, 10);
    else value = Math.round(parseFloat(row.avg_wait_min));

    return {
      name: row.month_name,
      value,
    };
  });
}
