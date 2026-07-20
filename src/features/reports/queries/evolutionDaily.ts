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
