import { pool } from "@/infra/database";
import { Ticket } from "../types";
import { mapTicketRow } from "./base";

/**
 * Insere uma nova senha gerando o ID sequencial diário de forma atômica
 */
export async function insertTicket(
  categoryId: number,
  categoryName: string,
  priority: "Normal" | "Prioritário",
  locationId: number
): Promise<Ticket> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Trava a tabela para evitar que dois processos gerem a mesma senha simultaneamente
    await client.query("LOCK TABLE tickets IN SHARE ROW EXCLUSIVE MODE");

    // Fetch the ticket_char from the category
    const catRes = await client.query("SELECT ticket_char FROM categories WHERE id = $1", [categoryId]);
    const ticketChar = catRes.rows.length > 0 ? catRes.rows[0].ticket_char : "G";

    // Obter o prefixo correspondente
    let prefix = ticketChar.substring(0, 3);
    if (priority === "Prioritário") {
      prefix = "P" + prefix;
    }

    // Contar o número de senhas geradas hoje (sem contar encaminhamentos 'E')
    // Contamos por local para reiniciar a sequência em cada local.
    const countRes = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '\\d+') AS INTEGER)), 0) + 1 AS next_num
       FROM tickets 
       WHERE created_at >= CURRENT_DATE AND ticket_number NOT LIKE '%E' AND location_id = $1`,
      [locationId]
    );
    
    const nextNum = countRes.rows[0].next_num;
    const numberStr = String(nextNum).padStart(3, "0");
    const ticketNumber = `${prefix}${numberStr}`;

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let securityCode = "";
    for (let i = 0; i < 4; i++) {
      securityCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const insertRes = await client.query(
      `INSERT INTO tickets (ticket_number, category_id, category_name, priority, status, security_code, location_id)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)
       RETURNING *`,
      [ticketNumber, categoryId, categoryName, priority, securityCode, locationId]
    );

    await client.query("COMMIT");
    return mapTicketRow(insertRes.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
