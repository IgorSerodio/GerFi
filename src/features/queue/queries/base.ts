import { Ticket } from "../types";

export interface DbTicketRow {
  id: string;
  ticket_number: string;
  category_id: number;
  category_name: string;
  priority: "Normal" | "Prioritário";
  status: "pending" | "calling" | "started" | "completed" | "no_show" | "forwarded";
  created_at: Date;
  called_at?: Date | null;
  completed_at?: Date | null;
  attendant?: string | null;
  guiche?: string | null;
  observation?: string | null;
  security_code?: string;
  started_at?: Date | null;
  resolutions?: string[];
  recall_history?: Date[] | null;
  forwarded_to?: string | null;
  location_id: number;
}

export function mapTicketRow(row: DbTicketRow): Ticket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    categoryId: row.category_id,
    categoryName: row.category_name,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    calledAt: row.called_at?.toISOString() || undefined,
    completedAt: row.completed_at?.toISOString() || undefined,
    attendant: row.attendant || undefined,
    guiche: row.guiche || undefined,
    observation: row.observation || undefined,
    securityCode: row.security_code || undefined,
    startedAt: row.started_at?.toISOString() || undefined,
    resolutions: row.resolutions || [],
    recallHistory: row.recall_history?.map((d) => d.toISOString()) || [],
    forwardedTo: row.forwarded_to || undefined,
    locationId: row.location_id,
  };
}
