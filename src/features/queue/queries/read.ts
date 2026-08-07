import { pool } from "@/infra/database";
import { Ticket } from "../types";
import { mapTicketRow } from "./base";

/**
 * Busca todas as senhas aguardando atendimento
 */
export async function getActiveQueue(locationId: number, services?: number[]): Promise<Ticket[]> {
  const servicesArray = services && services.length > 0 ? services : null;

  const { rows } = await pool.query(
    `SELECT t.*, tw.alias as guiche_alias FROM tickets t
     LEFT JOIN ticket_windows tw ON t.guiche = tw.name
     WHERE t.status = 'pending' 
       AND t.location_id = $1
       AND t.created_at >= CURRENT_DATE
       AND ($2::integer[] IS NULL OR t.category_id = ANY($2::integer[]))
     ORDER BY (t.priority = 'Prioritário') DESC, t.created_at ASC`,
    [locationId, servicesArray]
  );
  return rows.map(mapTicketRow);
}

/**
 * Busca o histórico de senhas chamadas ou concluídas (limite de 50)
 */
export async function getHistory(locationId: number, services?: number[]): Promise<Ticket[]> {
  const servicesArray = services && services.length > 0 ? services : null;

  const { rows } = await pool.query(
    `SELECT t.*, tw.alias as guiche_alias FROM tickets t
     LEFT JOIN ticket_windows tw ON t.guiche = tw.name
     WHERE t.status IN ('calling', 'started', 'completed', 'no_show', 'forwarded') 
       AND t.location_id = $1
       AND t.created_at >= CURRENT_DATE
       AND ($2::integer[] IS NULL OR t.category_id = ANY($2::integer[]))
     ORDER BY COALESCE((SELECT max(x) FROM unnest(t.recall_history) x), t.called_at, t.created_at) DESC 
     LIMIT 50`,
    [locationId, servicesArray]
  );
  return rows.map(mapTicketRow);
}

/**
 * Obtém os dados de um ticket pelo seu ID
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const { rows } = await pool.query(
    `SELECT t.*, tw.alias as guiche_alias FROM tickets t
     LEFT JOIN ticket_windows tw ON t.guiche = tw.name
     WHERE t.id = $1`,
    [ticketId]
  );
  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}
