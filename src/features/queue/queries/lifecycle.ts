import { pool } from "@/infra/database";
import { Ticket } from "../types";
import { mapTicketRow } from "./base";

/**
 * Registra a rechamada de um ticket no histórico
 */
export async function registerTicketRecall(ticketId: string): Promise<Ticket | null> {
  const { rows } = await pool.query(
    `WITH updated AS (
       UPDATE tickets SET recall_history = array_append(recall_history, NOW()) WHERE id = $1 RETURNING *
     )
     SELECT u.*, tw.name as guiche_name, tw.alias AS guiche_alias, usr.name as attendant_name
     FROM updated u
     LEFT JOIN ticket_windows tw ON u.ticket_window_id = tw.id
     LEFT JOIN users usr ON u.attendant_id = usr.id`,
    [ticketId]
  );
  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}

/**
 * Chama o próximo ticket disponível da fila de forma segura (concorrência travada via FOR UPDATE SKIP LOCKED)
 */
export async function callNextTicket(
  locationId: number,
  attendantId: number,
  ticketWindowId: number,
  allowedServices: number[],
  priorityParam?: "Normal" | "Prioritário",
  isForwardedCall?: boolean
): Promise<Ticket | null> {
  const servicesArray = allowedServices.length > 0 ? allowedServices : null;

  let queryStr = `
    WITH updated AS (
      UPDATE tickets 
      SET status = 'calling', called_at = NOW(), attendant_id = $2, ticket_window_id = $3
    WHERE id = (
      SELECT id FROM tickets 
      WHERE status = 'pending' 
        AND location_id = $4
        AND created_at >= CURRENT_DATE
  `;
  const queryParams: unknown[] = [servicesArray, attendantId, ticketWindowId, locationId];

  if (isForwardedCall) {
    queryStr += ` AND (
      (forward_type = 'single' AND forwarded_to = $3::text)
      OR 
      (forward_type = 'group' AND forwarded_to = (SELECT group_name FROM ticket_windows WHERE id = $3 LIMIT 1))
    )`;
    queryStr += ` AND ($1::integer[] IS NULL OR $1::integer[] IS NOT NULL)`;
  } else {
    queryStr += ` AND forwarded_to IS NULL`;
    if (priorityParam) {
      queryParams.push(priorityParam);
      queryStr += ` AND priority = $${queryParams.length}`;
    }
    queryStr += ` AND ($1::integer[] IS NULL OR category_id = ANY($1::integer[]))`;
  }

  queryStr += `
      ORDER BY created_at ASC 
      LIMIT 1 
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  )
  SELECT u.*, tw.name as guiche_name, tw.alias AS guiche_alias, usr.name as attendant_name
  FROM updated u
  LEFT JOIN ticket_windows tw ON u.ticket_window_id = tw.id
  LEFT JOIN users usr ON u.attendant_id = usr.id`;

  const { rows } = await pool.query(queryStr, queryParams);

  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}

/**
 * Marca uma senha como não compareceu.
 */
export async function markAsNoShow(ticketId: string): Promise<Ticket | null> {
  const { rows } = await pool.query(
    `WITH updated AS (
       UPDATE tickets
       SET status = 'no_show',
           completed_at = NOW()
       WHERE id = $1
       RETURNING *
     )
     SELECT u.*, tw.name as guiche_name, tw.alias AS guiche_alias, usr.name as attendant_name
     FROM updated u
     LEFT JOIN ticket_windows tw ON u.ticket_window_id = tw.id
     LEFT JOIN users usr ON u.attendant_id = usr.id`,
    [ticketId]
  );
  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}

/**
 * Finaliza um atendimento gravando a observação e as resoluções (checklists)
 */
export async function finishTicket(ticketId: string, observation?: string, resolutions?: string[]): Promise<Ticket | null> {
  const { rows } = await pool.query(
    `WITH updated AS (
       UPDATE tickets
       SET status = 'completed',
           completed_at = NOW(),
           observation = $2,
           resolutions = $3::jsonb
       WHERE id = $1
       RETURNING *
     )
     SELECT u.*, tw.name as guiche_name, tw.alias AS guiche_alias, usr.name as attendant_name
     FROM updated u
     LEFT JOIN ticket_windows tw ON u.ticket_window_id = tw.id
     LEFT JOIN users usr ON u.attendant_id = usr.id`,
    [ticketId, observation || null, JSON.stringify(resolutions || [])]
  );
  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}

/**
 * Inicializa um ticket mediante a validação do código de segurança de 4 letras.
 */
export async function startTicket(ticketId: string, code: string): Promise<{ success: boolean; error?: string; ticket?: Ticket }> {
  const { rows } = await pool.query("SELECT security_code FROM tickets WHERE id = $1", [ticketId]);
  if (rows.length === 0) return { success: false, error: "Senha não encontrada." };
  
  if (rows[0].security_code !== code.toUpperCase()) {
    return { success: false, error: "Código inválido." };
  }

  const updateRes = await pool.query(
    `WITH updated AS (
       UPDATE tickets
       SET status = 'started',
           started_at = NOW()
       WHERE id = $1
       RETURNING *
     )
     SELECT u.*, tw.name as guiche_name, tw.alias AS guiche_alias, usr.name as attendant_name
     FROM updated u
     LEFT JOIN ticket_windows tw ON u.ticket_window_id = tw.id
     LEFT JOIN users usr ON u.attendant_id = usr.id`,
    [ticketId]
  );
  
  return { success: true, ticket: mapTicketRow(updateRes.rows[0]) };
}

/**
 * Encaminha uma senha para outro guichê, criando uma nova entrada sequencial com 'E' no ID
 */
export async function forwardTicket(
  ticketId: string,
  targetValue: string | number,
  targetType: "single" | "group" = "single"
): Promise<Ticket | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const origRes = await client.query("SELECT * FROM tickets WHERE id = $1", [ticketId]);
    if (origRes.rows.length === 0) {
      await client.query("COMMIT");
      return null;
    }
    const original = origRes.rows[0];

    // Para montar a observação amigável: se for "single", pegamos o nome do guichê via ID
    let targetName = String(targetValue);
    if (targetType === "single") {
      const twRes = await client.query("SELECT name FROM ticket_windows WHERE id = $1 LIMIT 1", [targetValue]);
      if (twRes.rows.length > 0) targetName = twRes.rows[0].name;
    }

    await client.query(
      `UPDATE tickets 
       SET status = 'forwarded', 
           completed_at = NOW(), 
           observation = $2 
       WHERE id = $1`,
      [ticketId, targetType === 'group' ? `Encaminhado para o grupo ${targetName}` : `Encaminhado para ${targetName}`]
    );

    const newRes = await client.query(
      `WITH inserted AS (
         INSERT INTO tickets (ticket_number, category_id, category_name, priority, status, forwarded_to, forward_type, security_code, location_id)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
         RETURNING *
       )
       SELECT i.*, tw.name as guiche_name, tw.alias AS guiche_alias, usr.name as attendant_name
       FROM inserted i
       LEFT JOIN ticket_windows tw ON i.ticket_window_id = tw.id
       LEFT JOIN users usr ON i.attendant_id = usr.id`,
      [original.ticket_number, original.category_id, original.category_name, original.priority, String(targetValue), targetType, original.security_code, original.location_id]
    );

    await client.query("COMMIT");
    return mapTicketRow(newRes.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
