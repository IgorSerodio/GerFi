import { pool } from "@/infra/database";
import { Ticket, DbCategory } from "./types";

interface DbTicketRow {
  id: string;
  ticket_number: string;
  category_id: number;
  category_name: string;
  priority: "Normal" | "Prioritário";
  status: "pending" | "calling" | "completed" | "no_show" | "forwarded";
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
}

/**
 * Converte as linhas do banco (snake_case) para o formato do TypeScript (camelCase)
 */
function mapTicketRow(row: DbTicketRow): Ticket {
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
    recallHistory: row.recall_history?.map(d => d.toISOString()) || [],
    forwardedTo: row.forwarded_to || undefined,
  };
}

/**
 * Busca todas as senhas aguardando atendimento
 */
export async function getActiveQueue(services?: number[]): Promise<Ticket[]> {
  const servicesArray = services && services.length > 0 ? services : null;

  const { rows } = await pool.query(
    `SELECT * FROM tickets 
     WHERE status = 'pending' 
       AND created_at >= CURRENT_DATE
       AND ($1::integer[] IS NULL OR category_id = ANY($1::integer[]))
     ORDER BY (priority = 'Prioritário') DESC, created_at ASC`,
    [servicesArray]
  );
  return rows.map(mapTicketRow);
}

/**
 * Busca o histórico de senhas chamadas ou concluídas (limite de 10)
 */
export async function getHistory(services?: number[]): Promise<Ticket[]> {
  const servicesArray = services && services.length > 0 ? services : null;

  const { rows } = await pool.query(
    `SELECT * FROM tickets 
     WHERE status IN ('calling', 'completed', 'no_show', 'forwarded') 
       AND created_at >= CURRENT_DATE
       AND ($1::integer[] IS NULL OR category_id = ANY($1::integer[]))
     ORDER BY COALESCE(called_at, created_at) DESC 
     LIMIT 50`,
    [servicesArray]
  );
  return rows.map(mapTicketRow);
}

/**
 * Insere uma nova senha gerando o ID sequencial diário de forma atômica
 */
export async function insertTicket(
  categoryId: number,
  categoryName: string,
  priority: "Normal" | "Prioritário"
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
      prefix = "P" + ticketChar.substring(0, 2);
    }

    // Contar o número de senhas geradas hoje (sem contar encaminhamentos 'E')
    const countRes = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '\\d+') AS INTEGER)), 0) + 1 AS next_num
       FROM tickets 
       WHERE created_at >= CURRENT_DATE AND ticket_number NOT LIKE '%E'`
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
      `INSERT INTO tickets (ticket_number, category_id, category_name, priority, status, security_code)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [ticketNumber, categoryId, categoryName, priority, securityCode]
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

/**
 * Chama o próximo ticket disponível da fila de forma segura (concorrência travada via FOR UPDATE SKIP LOCKED)
 */
export async function callNextTicket(
  attendant: string,
  guiche: string,
  allowedServices: number[],
  priorityParam?: "Normal" | "Prioritário",
  isForwardedCall?: boolean
): Promise<Ticket | null> {
  const servicesArray = allowedServices.length > 0 ? allowedServices : null;

  let queryStr = `
    UPDATE tickets 
    SET status = 'calling', called_at = NOW(), attendant = $2, guiche = $3
    WHERE id = (
      SELECT id FROM tickets 
      WHERE status = 'pending' 
        AND created_at >= CURRENT_DATE
  `;
  const queryParams: any[] = [servicesArray, attendant, guiche];

  if (isForwardedCall) {
    queryStr += ` AND forwarded_to = $3`;
  } else {
    queryStr += ` AND forwarded_to IS NULL`;
    if (priorityParam) {
      queryStr += ` AND priority = $4`;
      queryParams.push(priorityParam);
    }
  }

  queryStr += `
      AND ($1::integer[] IS NULL OR category_id = ANY($1::integer[]))
      ORDER BY created_at ASC 
      LIMIT 1 
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *`;

  const { rows } = await pool.query(queryStr, queryParams);

  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}

/**
 * Re-chama uma senha que já está em atendimento (atualiza called_at para emitir sinal sonoro e guarda no histórico)
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const { rows } = await pool.query(
    "UPDATE tickets SET called_at = NOW(), recall_history = array_append(recall_history, NOW()) WHERE id = $1 RETURNING *",
    [ticketId]
  );
  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}

/**
 * Marca uma senha como não compareceu.
 */
export async function markAsNoShow(ticketId: string): Promise<Ticket | null> {
  const { rows } = await pool.query(
    `UPDATE tickets
     SET status = 'no_show',
         completed_at = NOW()
     WHERE id = $1
     RETURNING *`,
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
    `UPDATE tickets
     SET status = 'completed',
         completed_at = NOW(),
         observation = $2,
         resolutions = $3::jsonb
     WHERE id = $1
     RETURNING *`,
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
    `UPDATE tickets
     SET started_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [ticketId]
  );
  
  return { success: true, ticket: mapTicketRow(updateRes.rows[0]) };
}

/**
 * Encaminha uma senha para outro guichê, criando uma nova entrada sequencial com 'E' no ID
 */
export async function forwardTicket(
  ticketId: string,
  targetGuiche: string,
  attendant: string
): Promise<Ticket | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Buscar o ticket original
    const origRes = await client.query("SELECT * FROM tickets WHERE id = $1", [ticketId]);
    if (origRes.rows.length === 0) {
      await client.query("COMMIT");
      return null;
    }
    const original = origRes.rows[0];

    // Finalizar o ticket original como encaminhado
    await client.query(
      `UPDATE tickets 
       SET status = 'forwarded', 
           completed_at = NOW(), 
           observation = $2 
       WHERE id = $1`,
      [ticketId, `Encaminhado para ${targetGuiche}`]
    );

    // Inserir o novo ticket como pendente, associado ao guichê de destino
    const newRes = await client.query(
      `INSERT INTO tickets (ticket_number, category_id, category_name, priority, status, forwarded_to, security_code)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)
       RETURNING *`,
      [original.ticket_number, original.category_id, original.category_name, original.priority, targetGuiche, original.security_code]
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

export async function getCategories(): Promise<DbCategory[]> {
  const { rows } = await pool.query("SELECT id, ticket_char as \"ticketChar\", name, description, icon, color, expected_time_normal as \"expectedTimeNormal\", expected_time_priority as \"expectedTimePriority\", resolutions FROM categories ORDER BY id ASC");
  return rows;
}

export async function getTicketWindows(): Promise<{ id: number; name: string }[]> {
  const { rows } = await pool.query("SELECT id, name FROM ticket_windows ORDER BY name ASC");
  return rows;
}

export async function createCategory(data: Omit<DbCategory, "id">): Promise<DbCategory> {
  const { rows } = await pool.query(
    `INSERT INTO categories (ticket_char, name, description, icon, color, expected_time_normal, expected_time_priority, resolutions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     RETURNING id, ticket_char as "ticketChar", name, description, icon, color, expected_time_normal as "expectedTimeNormal", expected_time_priority as "expectedTimePriority", resolutions`,
    [data.ticketChar, data.name, data.description, data.icon, data.color, data.expectedTimeNormal, data.expectedTimePriority, JSON.stringify(data.resolutions || [])]
  );
  return rows[0];
}

export async function updateCategory(id: number, data: Partial<DbCategory>): Promise<DbCategory> {
  const { rows } = await pool.query(
    `UPDATE categories
     SET ticket_char = COALESCE($1, ticket_char),
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         icon = COALESCE($4, icon),
         color = COALESCE($5, color),
         expected_time_normal = COALESCE($6, expected_time_normal),
         expected_time_priority = COALESCE($7, expected_time_priority),
         resolutions = COALESCE($8::jsonb, resolutions)
     WHERE id = $9
     RETURNING id, ticket_char as "ticketChar", name, description, icon, color, expected_time_normal as "expectedTimeNormal", expected_time_priority as "expectedTimePriority", resolutions`,
    [data.ticketChar, data.name, data.description, data.icon, data.color, data.expectedTimeNormal, data.expectedTimePriority, data.resolutions ? JSON.stringify(data.resolutions) : null, id]
  );
  return rows[0];
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    const { rowCount } = await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23503') {
      throw new Error("Não é possível excluir o serviço pois existem senhas vinculadas a ele.");
    }
    throw error;
  }
}

export async function createNextTicketWindow(): Promise<{ id: number; name: string }> {
  const { rows } = await pool.query(
    `INSERT INTO ticket_windows (name)
     VALUES (
       'Guichê ' || LPAD(
         COALESCE(
           (SELECT MAX(CAST(SUBSTRING(name FROM '\\d+') AS INTEGER)) FROM ticket_windows) + 1, 
           1
         )::text, 
         2, 
         '0'
       )
     )
     RETURNING id, name`
  );
  return rows[0];
}

export async function deleteTicketWindow(id: number): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM ticket_windows WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
