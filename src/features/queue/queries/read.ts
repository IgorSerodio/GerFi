import { pool } from "@/infra/database";
import { Ticket } from "../types";
import { mapTicketRow } from "./base";

/**
 * Busca todas as senhas aguardando atendimento
 */
export async function getActiveQueue(locationId: number, services?: number[]): Promise<Ticket[]> {
  const servicesArray = services && services.length > 0 ? services : null;

  const { rows } = await pool.query(
    `SELECT * FROM tickets 
     WHERE status = 'pending' 
       AND location_id = $1
       AND created_at >= CURRENT_DATE
       AND ($2::integer[] IS NULL OR category_id = ANY($2::integer[]))
     ORDER BY (priority = 'Prioritário') DESC, created_at ASC`,
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
    `SELECT * FROM tickets 
     WHERE status IN ('calling', 'started', 'completed', 'no_show', 'forwarded') 
       AND location_id = $1
       AND created_at >= CURRENT_DATE
       AND ($2::integer[] IS NULL OR category_id = ANY($2::integer[]))
     ORDER BY COALESCE((SELECT max(x) FROM unnest(recall_history) x), called_at, created_at) DESC 
     LIMIT 50`,
    [locationId, servicesArray]
  );
  return rows.map(mapTicketRow);
}

/**
 * Re-chama uma senha que já está em atendimento (atualiza called_at para emitir sinal sonoro e guarda no histórico)
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const { rows } = await pool.query(
    "UPDATE tickets SET recall_history = array_append(recall_history, NOW()) WHERE id = $1 RETURNING *",
    [ticketId]
  );
  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}
