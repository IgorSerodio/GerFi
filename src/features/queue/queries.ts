import { pool } from "@/infra/database";
import { Ticket, TvSettings, User, YouTubeVideo, DbCategory } from "./types";

interface DbTicketRow {
  id: string;
  ticket_number: string;
  category_id: number;
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
  slug: string;
  name: string;
  mode: "live" | "files";
  live_url: string;
  uploaded_files: string[] | string | null;
  services: number[];
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
    slug: row.slug || "global",
    name: row.name || "TV",
    mode: row.mode,
    videoUrl,
    uploadedFiles,
    services: row.services || [],
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
     WHERE status IN ('calling', 'completed') 
       AND ($1::integer[] IS NULL OR category_id = ANY($1::integer[]))
     ORDER BY COALESCE(called_at, created_at) DESC 
     LIMIT 10`,
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
    let prefix = ticketChar;
    if (priority === "Prioritário") {
      prefix = "P";
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
      `INSERT INTO tickets (ticket_number, category_id, category_name, priority, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [ticketNumber, categoryId, categoryName, priority]
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
  allowedServices: number[]
): Promise<Ticket | null> {
  const servicesArray = allowedServices && allowedServices.length > 0 ? allowedServices : null;

  const { rows } = await pool.query(
    `WITH next_ticket AS (
      SELECT id FROM tickets
      WHERE status = 'pending'
        AND ($1::integer[] IS NULL OR category_id = ANY($1::integer[]))
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
      `INSERT INTO tickets (id, category_id, category_name, priority, status, called_at, attendant, guiche)
       VALUES ($1, $2, $3, $4, 'calling', NOW(), $5, $6)
       RETURNING *`,
      [nextId, original.category_id, original.category_name, original.priority, attendant, targetGuiche]
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
 * Obtém as configurações de uma TV específica pelo slug
 */
export async function getTvSettings(slug: string = "global"): Promise<TvSettings> {
  const { rows } = await pool.query("SELECT * FROM tv_settings WHERE slug = $1", [slug]);
  if (rows.length === 0) {
    if (slug === "global") {
      return { id: 1, slug: "global", name: "TV Principal", mode: "live", videoUrl: [], uploadedFiles: [], services: [] };
    }
    throw new Error("TV não encontrada.");
  }
  return mapTvSettingsRow(rows[0]);
}

/**
 * Obtém todas as TVs cadastradas
 */
export async function getAllTvSettings(): Promise<TvSettings[]> {
  const { rows } = await pool.query("SELECT * FROM tv_settings ORDER BY id ASC");
  return rows.map(mapTvSettingsRow);
}

/**
 * Cria uma nova TV
 */
export async function createTvSettings(
  slug: string,
  name: string,
  mode: "live" | "files",
  videoUrl: YouTubeVideo[],
  uploadedFiles: string[],
  services: number[]
): Promise<TvSettings> {
  const { rows } = await pool.query(
    `INSERT INTO tv_settings (slug, name, mode, live_url, uploaded_files, services)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [slug, name, mode, JSON.stringify(videoUrl), JSON.stringify(uploadedFiles), services]
  );
  return mapTvSettingsRow(rows[0]);
}

/**
 * Atualiza as configurações de uma TV
 */
export async function updateTvSettings(
  id: number,
  slug: string,
  name: string,
  mode: "live" | "files",
  videoUrl: YouTubeVideo[],
  uploadedFiles: string[],
  services: number[]
): Promise<TvSettings> {
  const { rows } = await pool.query(
    `UPDATE tv_settings
     SET slug = $1,
         name = $2,
         mode = $3,
         live_url = $4,
         uploaded_files = $5,
         services = $6
     WHERE id = $7
     RETURNING *`,
    [slug, name, mode, JSON.stringify(videoUrl), JSON.stringify(uploadedFiles), services, id]
  );
  return mapTvSettingsRow(rows[0]);
}

/**
 * Exclui uma TV
 */
export async function deleteTvSettings(id: number): Promise<boolean> {
  // Não permitir exclusão da TV global
  if (id === 1) throw new Error("A TV Principal não pode ser excluída.");
  const { rowCount } = await pool.query("DELETE FROM tv_settings WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
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
  const { name, role, guiche, matricula, cpf, email, username, password, services, blocked } = userData;
  const { rows } = await pool.query<User>(
    `INSERT INTO users (name, role, guiche, matricula, cpf, email, username, password, services, blocked)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, name, role, guiche, matricula, cpf, email, username, services, blocked`,
    [name, role, guiche, matricula, cpf, email, username, password, services || [], blocked ?? false]
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

/**
 * Busca um usuário pelo email (usado na recuperação de senha)
 */
export async function getUserByEmail(email: string) {
  const { rows } = await pool.query(
    "SELECT id, blocked, reset_pin, reset_pin_expires FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Define um PIN de recuperação e sua data de expiração para um usuário
 */
export async function setUserResetPin(id: number, pin: string, expiresAt: Date): Promise<void> {
  await pool.query(
    "UPDATE users SET reset_pin = $1, reset_pin_expires = $2 WHERE id = $3",
    [pin, expiresAt, id]
  );
}

/**
 * Limpa o PIN de recuperação e atualiza a senha de um usuário
 */
export async function clearUserResetPinAndUpdatePassword(id: number, hashedPassword: string): Promise<void> {
  await pool.query(
    "UPDATE users SET password = $1, reset_pin = NULL, reset_pin_expires = NULL WHERE id = $2",
    [hashedPassword, id]
  );
}

export async function getCategories(): Promise<{ id: number; ticketChar: string; name: string; description: string; icon: string; color: string }[]> {
  const { rows } = await pool.query("SELECT id, ticket_char as \"ticketChar\", name, description, icon, color FROM categories ORDER BY id ASC");
  return rows;
}

export async function getTicketWindows(): Promise<{ id: number; name: string }[]> {
  const { rows } = await pool.query("SELECT id, name FROM ticket_windows ORDER BY name ASC");
  return rows;
}

export async function createCategory(data: Omit<DbCategory, "id">): Promise<DbCategory> {
  const { rows } = await pool.query(
    `INSERT INTO categories (ticket_char, name, description, icon, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, ticket_char as "ticketChar", name, description, icon, color`,
    [data.ticketChar, data.name, data.description, data.icon, data.color]
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
         color = COALESCE($5, color)
     WHERE id = $6
     RETURNING id, ticket_char as "ticketChar", name, description, icon, color`,
    [data.ticketChar, data.name, data.description, data.icon, data.color, id]
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
