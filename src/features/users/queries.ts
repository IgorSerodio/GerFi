import { pool } from "@/infra/database";
import { User } from "./types";

/**
 * Retorna a lista completa de servidores/usuários cadastrados
 */
export async function getUsers(): Promise<User[]> {
  const { rows } = await pool.query<User>(
    `SELECT id, name, role, guiche, matricula, cpf, email, username, services, blocked 
     FROM users 
     ORDER BY name ASC`
  );
  return rows.map(row => ({
    ...row,
    services: (row.services || []).map(Number)
  }));
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
  return {
    ...rows[0],
    services: (rows[0].services || []).map(Number)
  };
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
    return {
      ...rows[0],
      services: (rows[0].services || []).map(Number)
    };
  } else {
    const { rows } = await pool.query<User>(
      `UPDATE users
       SET name = $1, role = $2, guiche = $3, matricula = $4, cpf = $5, email = $6, username = $7, services = $8
       WHERE id = $9
       RETURNING id, name, role, guiche, matricula, cpf, email, username, services, blocked`,
      [name, role, guiche, matricula, cpf, email, username, services || [], id]
    );
    return {
      ...rows[0],
      services: (rows[0].services || []).map(Number)
    };
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
  return {
    ...rows[0],
    services: (rows[0].services || []).map(Number)
  };
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

/**
 * Busca um usuário pelo ID
 */
export async function getUserById(id: number) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    services: (rows[0].services || []).map(Number)
  };
}

/**
 * Atualiza apenas os serviços de um usuário (para a aba Meus Serviços)
 */
export async function updateUserServices(id: number, services: number[]) {
  const { rows } = await pool.query(
    "UPDATE users SET services = $1 WHERE id = $2 RETURNING *",
    [services, id]
  );
  return {
    ...rows[0],
    services: (rows[0].services || []).map(Number)
  };
}
