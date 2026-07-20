import { pool } from "@/infra/database";
import { QueryParam, ChartPoint, getFilteredTicketsCTE } from "./base";

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
