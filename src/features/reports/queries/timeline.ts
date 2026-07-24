import { pool } from "@/infra/database";
import { QueryParam } from "./base";

export interface TimelineTicket {
  id: string;
  attendant: string;
  guiche: string;
  priority: "Normal" | "Prioritário";
  status: string;
  ticketNumber: string;
  createdAt: string;
  calledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  recallHistory: string[];
  forwardedTo: string | null;
  originalCreatedAt: string | null;
  originalCalledAt: string | null;
  globalWaitSeconds: number;
  globalServiceSeconds: number;
}

export async function getTimelineData(locationId: number | "all", attendants: string[], dateStr?: string): Promise<TimelineTicket[]> {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

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
    WHERE t.created_at >= $1::date 
      AND t.created_at < ($1::date + interval '1 day')
  `;
  const params: QueryParam[] = [targetDate];

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
    calledAt: row.called_at ? row.called_at.toISOString() : null,
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
  startedAt: Date | null;
  completedAt: Date | null;
  originalStartedAt: Date | null;
  originalCompletedAt: Date | null;
}

export async function getAnalyticalData(startDate: Date | null, endDate: Date | null, serviceId: string, locationId: number | "all", attendants: string[], page: number = 1, limit: number = 50): Promise<{ data: AnalyticalTicket[], total: number }> {
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

  const countQuery = `SELECT COUNT(*) as total FROM tickets t WHERE ${baseFilter}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  const offset = (page - 1) * limit;

  // Add pagination params
  params.push(limit);
  const limitParamIdx = params.length;
  params.push(offset);
  const offsetParamIdx = params.length;

  const queryStr = `
    SELECT 
      t.*,
      (SELECT MIN(created_at) FROM tickets f WHERE f.ticket_number = t.ticket_number AND f.created_at::date = t.created_at::date) as original_created_at,
      (SELECT MIN(started_at) FROM tickets f WHERE f.ticket_number = t.ticket_number AND f.created_at::date = t.created_at::date) as original_started_at,
      (SELECT MAX(completed_at) FROM tickets f WHERE f.ticket_number = t.ticket_number AND f.created_at::date = t.created_at::date) as original_completed_at
    FROM tickets t
    WHERE ${baseFilter}
    ORDER BY t.created_at DESC
    LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
  `;

  const { rows } = await pool.query(queryStr, params);

  return {
    total,
    data: rows.map((row) => ({
      ticketNumber: row.ticket_number,
      guiche: row.guiche,
      attendant: row.attendant,
      status: row.status,
      createdAt: row.created_at,
      originalCreatedAt: row.original_created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      originalStartedAt: row.original_started_at,
      originalCompletedAt: row.original_completed_at,
    }))
  };
}
