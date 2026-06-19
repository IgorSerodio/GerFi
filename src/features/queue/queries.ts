import { pool } from "@/infra/database";
import { Ticket, TvSettings, User, YouTubeVideo } from "./types";

interface DbTicketRow {
  id: string;
  ticket_number: string;
  type: string;
  category_name: string;
  priority: "Normal" | "Prioritário";
  status: "pending" | "calling" | "completed";
  created_at: Date;
  called_at?: Date | null;
  completed_at?: Date | null;
  attendant?: string | null;
  guiche?: string | null;
  observation?: string | null;
}

interface DbTvSettingsRow {
  id: number;
  mode: "live" | "files";
  live_url: string;
  uploaded_files: string[] | string | null;
}

/**
 * Converte as linhas do banco (snake_case) para o formato do TypeScript (camelCase)
 */
function mapTicketRow(row: DbTicketRow): Ticket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    type: row.type,
    categoryName: row.category_name,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    calledAt: row.called_at?.toISOString() || undefined,
    completedAt: row.completed_at?.toISOString() || undefined,
    attendant: row.attendant || undefined,
    guiche: row.guiche || undefined,
    observation: row.observation || undefined,
  };
}

function mapTvSettingsRow(row: DbTvSettingsRow): TvSettings {
  let uploadedFiles: string[] = [];
  if (Array.isArray(row.uploaded_files)) {
    uploadedFiles = row.uploaded_files;
  } else if (typeof row.uploaded_files === "string") {
    try {
      uploadedFiles = JSON.parse(row.uploaded_files);
    } catch {
      uploadedFiles = [];
    }
  }

  let videoUrl: YouTubeVideo[] = [];
  if (row.live_url) {
    try {
      videoUrl = JSON.parse(row.live_url);
    } catch {
      // Legacy support for plain string URLs
      const videoIdMatch = row.live_url.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : "";
      videoUrl = [{ url: row.live_url, videoId, title: "Vídeo TV" }];
    }
  }

  return {
    id: row.id,
    mode: row.mode,
    videoUrl,
    uploadedFiles,
  };
}

/**
 * Busca todas as senhas aguardando atendimento
 */
export async function getActiveQueue(): Promise<Ticket[]> {
  const { rows } = await pool.query(
    `SELECT * FROM tickets 
     WHERE status = 'pending' 
     ORDER BY (priority = 'Prioritário') DESC, created_at ASC`
  );
  return rows.map(mapTicketRow);
}

/**
 * Busca o histórico de senhas chamadas ou concluídas (limite de 10)
 */
export async function getHistory(): Promise<Ticket[]> {
  const { rows } = await pool.query(
    `SELECT * FROM tickets 
     WHERE status IN ('calling', 'completed') 
     ORDER BY COALESCE(called_at, created_at) DESC 
     LIMIT 10`
  );
  return rows.map(mapTicketRow);
}

/**
 * Insere uma nova senha gerando o ID sequencial diário de forma atômica
 */
export async function insertTicket(
  type: string,
  categoryName: string,
  priority: "Normal" | "Prioritário"
): Promise<Ticket> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Trava a tabela para evitar que dois processos gerem a mesma senha simultaneamente
    await client.query("LOCK TABLE tickets IN SHARE ROW EXCLUSIVE MODE");

    // Obter o prefixo correspondente
    let prefix = "G";
    if (priority === "Prioritário") {
      prefix = "P";
    } else {
      if (type === "TRIB") prefix = "T";
      else if (type === "CADA") prefix = "C";
      else if (type === "JURI") prefix = "J";
      else prefix = type.substring(0, 1).toUpperCase();
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

    const insertRes = await client.query(
      `INSERT INTO tickets (ticket_number, type, category_name, priority, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [ticketNumber, type, categoryName, priority]
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
  allowedServices: string[]
): Promise<Ticket | null> {
  const servicesArray = allowedServices && allowedServices.length > 0 ? allowedServices : null;

  const { rows } = await pool.query(
    `WITH next_ticket AS (
      SELECT id FROM tickets
      WHERE status = 'pending'
        AND ($1::text[] IS NULL OR type = ANY($1::text[]))
      ORDER BY (priority = 'Prioritário') DESC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE tickets
    SET status = 'calling',
        called_at = NOW(),
        attendant = $2,
        guiche = $3
    WHERE id = (SELECT id FROM next_ticket)
    RETURNING *`,
    [servicesArray, attendant, guiche]
  );

  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}

/**
 * Re-chama uma senha que já está em atendimento (apenas obtém os dados para emitir sinal sonoro)
 */
export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const { rows } = await pool.query("SELECT * FROM tickets WHERE id = $1", [ticketId]);
  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
}

/**
 * Finaliza um atendimento gravando a observação
 */
export async function finishTicket(ticketId: string, observation?: string): Promise<Ticket | null> {
  const { rows } = await pool.query(
    `UPDATE tickets
     SET status = 'completed',
         completed_at = NOW(),
         observation = $2
     WHERE id = $1
     RETURNING *`,
    [ticketId, observation || null]
  );
  if (rows.length === 0) return null;
  return mapTicketRow(rows[0]);
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
       SET status = 'completed', 
           completed_at = NOW(), 
           observation = $2 
       WHERE id = $1`,
      [ticketId, `Encaminhado para ${targetGuiche}`]
    );

    // Criar o novo ID adicionando 'E' (ou incrementando a contagem de encaminhados se já possuir 'E')
    const nextId = `${original.id}E`;
    
    // Inserir o novo ticket já em status 'calling' para chamar diretamente na TV
    const newRes = await client.query(
      `INSERT INTO tickets (id, type, category_name, priority, status, called_at, attendant, guiche)
       VALUES ($1, $2, $3, $4, 'calling', NOW(), $5, $6)
       RETURNING *`,
      [nextId, original.type, original.category_name, original.priority, attendant, targetGuiche]
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

/**
 * Obtém as configurações da TV
 */
export async function getTvSettings(): Promise<TvSettings> {
  const { rows } = await pool.query("SELECT * FROM tv_settings WHERE id = 1");
  if (rows.length === 0) {
    return { id: 1, mode: "live", videoUrl: [], uploadedFiles: [] };
  }
  return mapTvSettingsRow(rows[0]);
}

/**
 * Atualiza as configurações da TV
 */
export async function updateTvSettings(
  mode: "live" | "files",
  videoUrl: YouTubeVideo[],
  uploadedFiles: string[]
): Promise<TvSettings> {
  const { rows } = await pool.query(
    `UPDATE tv_settings
     SET mode = $1,
         live_url = $2,
         uploaded_files = $3
     WHERE id = 1
     RETURNING *`,
    [mode, JSON.stringify(videoUrl), JSON.stringify(uploadedFiles)]
  );
  return mapTvSettingsRow(rows[0]);
}
/**
 * Retorna a lista completa de servidores/usuários cadastrados
 */
export async function getUsers(): Promise<User[]> {
  const { rows } = await pool.query<User>(
    `SELECT id, name, role, guiche, matricula, cpf, email, username, services, blocked 
     FROM users 
     ORDER BY name ASC`
  );
  return rows;
}

/**
 * Cria um novo servidor no banco
 */
export async function createUser(userData: Omit<User, "id">): Promise<User> {
  const { name, role, guiche, matricula, cpf, email, username, password, services } = userData;
  const { rows } = await pool.query<User>(
    `INSERT INTO users (name, role, guiche, matricula, cpf, email, username, password, services, blocked)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)
     RETURNING id, name, role, guiche, matricula, cpf, email, username, services, blocked`,
    [name, role, guiche, matricula, cpf, email, username, password, services || []]
  );
  return rows[0];
}

/**
 * Atualiza um servidor existente
 */
export async function updateUser(id: number, userData: Partial<User>): Promise<User> {
  const { name, role, guiche, matricula, cpf, email, username, services, password } = userData;
  
  if (password) {
    const { rows } = await pool.query<User>(
      `UPDATE users
       SET name = $1, role = $2, guiche = $3, matricula = $4, cpf = $5, email = $6, username = $7, services = $8, password = $9
       WHERE id = $10
       RETURNING id, name, role, guiche, matricula, cpf, email, username, services, blocked`,
      [name, role, guiche, matricula, cpf, email, username, services || [], password, id]
    );
    return rows[0];
  } else {
    const { rows } = await pool.query<User>(
      `UPDATE users
       SET name = $1, role = $2, guiche = $3, matricula = $4, cpf = $5, email = $6, username = $7, services = $8
       WHERE id = $9
       RETURNING id, name, role, guiche, matricula, cpf, email, username, services, blocked`,
      [name, role, guiche, matricula, cpf, email, username, services || [], id]
    );
    return rows[0];
  }
}

/**
 * Exclui um servidor
 */
export async function deleteUser(id: number): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

/**
 * Bloqueia/Desbloqueia um servidor
 */
export async function toggleBlockUser(id: number): Promise<User> {
  const { rows } = await pool.query<User>(
    `UPDATE users 
     SET blocked = NOT blocked 
     WHERE id = $1 
     RETURNING id, name, role, guiche, matricula, cpf, email, username, services, blocked`,
    [id]
  );
  return rows[0];
}
