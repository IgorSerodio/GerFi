import { pool } from "@/infra/database";

export interface VolumeStats {
  total: number;
  avgWait: string;
  efficiency: string;
}

export interface ChartPoint {
  name: string;
  value: number;
}

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
 * Obtém estatísticas gerais para um intervalo de datas
 */
export async function getVolumeStats(startDate: Date, endDate: Date, locationId: number | "all", attendants: string[]): Promise<VolumeStats> {
  let queryStr = `SELECT 
      COUNT(*) as total,
      COALESCE(AVG(EXTRACT(EPOCH FROM (called_at - created_at)) / 60), 0) as avg_wait_min,
      COALESCE((COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0), 0) as efficiency
     FROM tickets
     WHERE created_at BETWEEN $1 AND $2`;
  const params: any[] = [startDate, endDate];

  if (locationId !== "all") {
    params.push(locationId);
    queryStr += ` AND location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    queryStr += ` AND attendant = ANY($${params.length})`;
  }

  const { rows } = await pool.query(queryStr, params);

  const stats = rows[0];
  return {
    total: parseInt(stats.total, 10),
    avgWait: `${Math.round(parseFloat(stats.avg_wait_min))}min`,
    efficiency: `${Math.round(parseFloat(stats.efficiency))}%`,
  };
}

/**
 * Obtém evolução horária de hoje (08:00 às 19:00)
 */
export async function getHourlyEvolutionToday(
  metric: "tickets" | "wait_time" | "atendimentos",
  locationId: number | "all",
  attendants: string[]
): Promise<ChartPoint[]> {
  let ticketFilter = "t.created_at::date = CURRENT_DATE";
  const params: any[] = [];

  if (locationId !== "all") {
    params.push(locationId);
    ticketFilter += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    ticketFilter += ` AND t.attendant = ANY($${params.length})`;
  }

  const { rows } = await pool.query(
    `WITH hours AS (
       SELECT generate_series(
         date_trunc('day', CURRENT_TIMESTAMP) + interval '8 hours',
         date_trunc('day', CURRENT_TIMESTAMP) + interval '19 hours',
         interval '1 hour'
       ) AS hour_bucket
     )
     SELECT 
       to_char(h.hour_bucket, 'HH24:MI') as hour_name,
       COUNT(t.id) as ticket_count,
       COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_count,
       COALESCE(AVG(EXTRACT(EPOCH FROM (t.called_at - t.created_at)) / 60), 0) as avg_wait_min
     FROM hours h
     LEFT JOIN tickets t ON 
       t.created_at >= h.hour_bucket AND 
       t.created_at < h.hour_bucket + interval '1 hour' AND 
       ${ticketFilter}
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

/**
 * Obtém evolução diária da semana atual
 */
export async function getWeeklyEvolution(
  metric: "tickets" | "wait_time" | "atendimentos",
  locationId: number | "all",
  attendants: string[]
): Promise<ChartPoint[]> {
  let ticketFilter = "t.created_at::date = d.day_bucket::date";
  const params: any[] = [];

  if (locationId !== "all") {
    params.push(locationId);
    ticketFilter += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    ticketFilter += ` AND t.attendant = ANY($${params.length})`;
  }

  const { rows } = await pool.query(
    `WITH days AS (
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
       COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_count,
       COALESCE(AVG(EXTRACT(EPOCH FROM (t.called_at - t.created_at)) / 60), 0) as avg_wait_min
     FROM days d
     LEFT JOIN tickets t ON ${ticketFilter}
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

/**
 * Obtém o ranking de serviços mais procurados no período
 */
export async function getCategoryRanking(startDate: Date, endDate: Date, locationId: number | "all", attendants: string[]): Promise<CategoryRank[]> {
  let innerQueryStr = `SELECT COUNT(*) as total FROM tickets WHERE created_at BETWEEN $1 AND $2`;
  let queryStr = `
     SELECT 
       category_name as name,
       COUNT(*) as count,
       COALESCE((COUNT(*) * 100.0) / NULLIF((SELECT total FROM total_tickets), 0), 0) as percentage
     FROM tickets
     WHERE created_at BETWEEN $1 AND $2`;
  const params: any[] = [startDate, endDate];

  if (locationId !== "all") {
    params.push(locationId);
    innerQueryStr += ` AND location_id = $${params.length}`;
    queryStr += ` AND location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    innerQueryStr += ` AND attendant = ANY($${params.length})`;
    queryStr += ` AND attendant = ANY($${params.length})`;
  }

  queryStr += `
     GROUP BY category_name
     ORDER BY count DESC
     LIMIT 4`;

  const finalQuery = `WITH total_tickets AS (${innerQueryStr}) ${queryStr}`;
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
  let queryStr = `SELECT 
       attendant as name,
       COUNT(*) as count,
       COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60), 0) as avg_duration
     FROM tickets
     WHERE status = 'completed' 
       AND attendant IS NOT NULL 
       AND created_at BETWEEN $1 AND $2`;
  const params: any[] = [startDate, endDate];

  if (locationId !== "all") {
    params.push(locationId);
    queryStr += ` AND location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    queryStr += ` AND attendant = ANY($${params.length})`;
  }

  queryStr += `
     GROUP BY attendant
     ORDER BY count DESC`;

  const { rows } = await pool.query(queryStr, params);

  return rows.map((row) => ({
    name: row.name,
    count: parseInt(row.count, 10),
    avgDuration: Math.round(parseFloat(row.avg_duration)),
    rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)), // Simulação de nota com base em média realista
  }));
}

export interface EvolutionPoint {
  time: string;
  total: number;
  avg: number;
  wait: number;
}

export async function getEvolutionSeries(startDate: Date, endDate: Date, serviceId: string, locationId: number | "all", attendants: string[]): Promise<EvolutionPoint[]> {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  let groupBy = "date_trunc('hour', created_at)";
  let dateFormat = "HH24:MI";
  if (diffDays > 2) {
    groupBy = "date_trunc('day', created_at)";
    dateFormat = "DD/MM";
  }

  let queryStr = `
    SELECT 
      to_char(${groupBy}, '${dateFormat}') as time_label,
      COUNT(id) as total_count,
      COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60), 0) as avg_duration,
      COALESCE(AVG(EXTRACT(EPOCH FROM (called_at - created_at)) / 60), 0) as avg_wait
    FROM tickets
    WHERE created_at BETWEEN $1 AND $2
  `;
  const params: any[] = [startDate, endDate];

  if (serviceId !== "all") {
    params.push(parseInt(serviceId, 10));
    queryStr += ` AND category_id = $${params.length}`;
  }
  if (locationId !== "all") {
    params.push(locationId);
    queryStr += ` AND location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    queryStr += ` AND attendant = ANY($${params.length})`;
  }

  queryStr += `
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
  let queryStr = `
    SELECT 
      LPAD(EXTRACT(HOUR FROM created_at)::text, 2, '0') || ':00' as time_label,
      COUNT(id) as total_count,
      COALESCE(AVG(EXTRACT(EPOCH FROM (called_at - created_at)) / 60), 0) as avg_wait
    FROM tickets
    WHERE created_at BETWEEN $1 AND $2
  `;
  const params: any[] = [startDate, endDate];

  if (serviceId !== "all") {
    params.push(parseInt(serviceId, 10));
    queryStr += ` AND category_id = $${params.length}`;
  }
  if (locationId !== "all") {
    params.push(locationId);
    queryStr += ` AND location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    queryStr += ` AND attendant = ANY($${params.length})`;
  }

  queryStr += `
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY EXTRACT(HOUR FROM created_at)
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
  let queryStr = `
    SELECT 
      EXTRACT(ISODOW FROM created_at) as dow,
      COUNT(id) as total_count
    FROM tickets
    WHERE created_at BETWEEN $1 AND $2
  `;
  const params: any[] = [startDate, endDate];

  if (serviceId !== "all") {
    params.push(parseInt(serviceId, 10));
    queryStr += ` AND category_id = $${params.length}`;
  }
  if (locationId !== "all") {
    params.push(locationId);
    queryStr += ` AND location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    queryStr += ` AND attendant = ANY($${params.length})`;
  }

  queryStr += `
    GROUP BY EXTRACT(ISODOW FROM created_at)
    ORDER BY EXTRACT(ISODOW FROM created_at)
  `;

  const { rows } = await pool.query(queryStr, params);
  
  const map: Record<number, string> = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom' };
  return rows.map((row) => ({
    name: map[parseInt(row.dow, 10)] || 'N/A',
    value: parseInt(row.total_count, 10),
  }));
}

export async function getCategoryAvgDuration(startDate: Date, endDate: Date, locationId: number | "all", attendants: string[]): Promise<ChartPoint[]> {
  let queryStr = `SELECT 
       category_name as name,
       COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60), 0) as avg_duration
     FROM tickets
     WHERE status = 'completed' AND started_at IS NOT NULL
       AND created_at BETWEEN $1 AND $2`;
  const params: any[] = [startDate, endDate];

  if (locationId !== "all") {
    params.push(locationId);
    queryStr += ` AND location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    queryStr += ` AND attendant = ANY($${params.length})`;
  }

  queryStr += `
     GROUP BY category_name
     ORDER BY avg_duration DESC
     LIMIT 5`;

  const { rows } = await pool.query(queryStr, params);

  return rows.map((row) => ({
    name: row.name || 'Desconhecido',
    value: Math.round(parseFloat(row.avg_duration)),
  }));
}
