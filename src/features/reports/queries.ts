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
export async function getVolumeStats(startDate: Date, endDate: Date): Promise<VolumeStats> {
  const { rows } = await pool.query(
    `SELECT 
      COUNT(*) as total,
      COALESCE(AVG(EXTRACT(EPOCH FROM (called_at - created_at)) / 60), 0) as avg_wait_min,
      COALESCE((COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0), 0) as efficiency
     FROM tickets
     WHERE created_at BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

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
export async function getHourlyEvolutionToday(metric: "tickets" | "wait_time" | "atendimentos"): Promise<ChartPoint[]> {
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
       t.created_at::date = CURRENT_DATE
     GROUP BY h.hour_bucket
     ORDER BY h.hour_bucket`
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
export async function getWeeklyEvolution(metric: "tickets" | "wait_time" | "atendimentos"): Promise<ChartPoint[]> {
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
     LEFT JOIN tickets t ON t.created_at::date = d.day_bucket::date
     GROUP BY d.day_bucket
     ORDER BY d.day_bucket`
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
export async function getCategoryRanking(startDate: Date, endDate: Date): Promise<CategoryRank[]> {
  const { rows } = await pool.query(
    `WITH total_tickets AS (
       SELECT COUNT(*) as total FROM tickets WHERE created_at BETWEEN $1 AND $2
     )
     SELECT 
       category_name as name,
       COUNT(*) as count,
       COALESCE((COUNT(*) * 100.0) / NULLIF((SELECT total FROM total_tickets), 0), 0) as percentage
     FROM tickets
     WHERE created_at BETWEEN $1 AND $2
     GROUP BY category_name
     ORDER BY count DESC
     LIMIT 4`,
    [startDate, endDate]
  );

  return rows.map((row) => ({
    name: row.name,
    count: parseInt(row.count, 10),
    value: Math.round(parseFloat(row.percentage)),
  }));
}

/**
 * Obtém produtividade dos atendentes no período
 */
export async function getAttendantRanking(startDate: Date, endDate: Date): Promise<AttendantRank[]> {
  const { rows } = await pool.query(
    `SELECT 
       attendant as name,
       COUNT(*) as count,
       COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - called_at)) / 60), 0) as avg_duration
     FROM tickets
     WHERE status = 'completed' 
       AND attendant IS NOT NULL 
       AND created_at BETWEEN $1 AND $2
     GROUP BY attendant
     ORDER BY count DESC`,
    [startDate, endDate]
  );

  return rows.map((row) => ({
    name: row.name,
    count: parseInt(row.count, 10),
    avgDuration: Math.round(parseFloat(row.avg_duration)),
    rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)), // Simulação de nota com base em média realista
  }));
}
