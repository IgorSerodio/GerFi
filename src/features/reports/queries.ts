import { pool } from "@/infra/database";

export type QueryParam = string | number | Date | string[];


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
 * Helper para aplicar filtro anti-duplicação de encaminhamentos
 */
function getFilteredTicketsCTE(baseFilter: string): string {
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
 * Obtém estatísticas gerais para um intervalo de datas
 */
export async function getVolumeStats(startDate: Date, endDate: Date, locationId: number | "all", attendants: string[]): Promise<VolumeStats> {
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
      COUNT(*) as total,
      COALESCE(AVG(chain_wait_seconds) / 60, 0) as avg_wait_min,
      COALESCE((COUNT(CASE WHEN effective_status = 'completed' THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0), 0) as efficiency
    FROM filtered_tickets
  `;

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

/**
 * Obtém evolução diária da semana atual
 */
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

/**
 * Obtém evolução diária do mês atual
 */
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

/**
 * Obtém evolução mensal do ano atual
 */
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

export interface TimelineTicket {
  id: string;
  attendant: string;
  guiche: string;
  priority: "Normal" | "Prioritário";
  status: string;
  ticketNumber: string;
  createdAt: string;
  calledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  recallHistory: string[];
  forwardedTo: string | null;
  originalCreatedAt: string | null;
  originalCalledAt: string | null;
  globalWaitSeconds: number;
  globalServiceSeconds: number;
}

export async function getTimelineDataToday(locationId: number | "all", attendants: string[]): Promise<TimelineTicket[]> {
  let queryStr = `
    SELECT 
      t.id, t.attendant, t.guiche, t.priority, t.status, t.ticket_number,
      t.created_at, t.called_at, t.started_at, t.completed_at,
      t.recall_history, t.forwarded_to,
      (SELECT MIN(created_at) FROM tickets f WHERE f.ticket_number = t.ticket_number AND f.created_at::date = t.created_at::date) as original_created_at,
      (SELECT MIN(called_at) FROM tickets f WHERE f.ticket_number = t.ticket_number AND f.created_at::date = t.created_at::date) as original_called_at,
      (SELECT SUM(EXTRACT(EPOCH FROM (called_at - created_at))) FROM tickets f WHERE f.ticket_number = t.ticket_number AND f.created_at::date = t.created_at::date) as global_wait_seconds,
      (SELECT SUM(EXTRACT(EPOCH FROM (completed_at - started_at))) FROM tickets f WHERE f.ticket_number = t.ticket_number AND f.created_at::date = t.created_at::date) as global_service_seconds
    FROM tickets t
    WHERE t.called_at IS NOT NULL
      AND t.created_at >= CURRENT_DATE
  `;
  const params: QueryParam[] = [];

  if (locationId !== "all") {
    params.push(locationId);
    queryStr += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    queryStr += ` AND t.attendant = ANY($${params.length})`;
  }

  queryStr += ` ORDER BY t.called_at ASC`;

  const { rows } = await pool.query(queryStr, params);

  return rows.map((row) => ({
    id: row.id,
    attendant: row.attendant || "Desconhecido",
    guiche: row.guiche || "-",
    priority: row.priority,
    status: row.status,
    ticketNumber: row.ticket_number,
    createdAt: row.created_at.toISOString(),
    calledAt: row.called_at.toISOString(),
    startedAt: row.started_at ? row.started_at.toISOString() : null,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
    recallHistory: row.recall_history ? row.recall_history.map((d: Date) => d.toISOString()) : [],
    forwardedTo: row.forwarded_to || null,
    originalCreatedAt: row.original_created_at ? row.original_created_at.toISOString() : null,
    originalCalledAt: row.original_called_at ? row.original_called_at.toISOString() : null,
    globalWaitSeconds: parseFloat(row.global_wait_seconds) || 0,
    globalServiceSeconds: parseFloat(row.global_service_seconds) || 0,
  }));
}

export interface AnalyticalTicket {
  ticketNumber: string;
  guiche: string | null;
  attendant: string | null;
  status: string;
  createdAt: Date;
  originalCreatedAt: Date;
}

export async function getAnalyticalData(startDate: Date, endDate: Date, serviceId: string, locationId: number | "all", attendants: string[]): Promise<AnalyticalTicket[]> {
  let queryStr = `
    SELECT 
      t.*,
      (SELECT MIN(created_at) FROM tickets f WHERE f.ticket_number = t.ticket_number AND f.created_at::date = t.created_at::date) as original_created_at
    FROM tickets t
    WHERE t.created_at BETWEEN $1 AND $2
  `;
  const params: QueryParam[] = [startDate, endDate];

  if (serviceId !== "all") {
    params.push(parseInt(serviceId, 10));
    queryStr += ` AND t.category_id = $${params.length}`;
  }
  if (locationId !== "all") {
    params.push(locationId);
    queryStr += ` AND t.location_id = $${params.length}`;
  }
  if (attendants && attendants.length > 0) {
    params.push(attendants);
    queryStr += ` AND t.attendant = ANY($${params.length})`;
  }

  queryStr += ` ORDER BY t.created_at DESC LIMIT 100`;
  const { rows } = await pool.query(queryStr, params);

  return rows.map((row) => ({
    ticketNumber: row.ticket_number,
    guiche: row.guiche,
    attendant: row.attendant,
    status: row.status,
    createdAt: row.created_at,
    originalCreatedAt: row.original_created_at,
  }));
}
