import { pool } from "@/infra/database";
import { DbCategory } from "./types";

export async function getCategories(): Promise<DbCategory[]> {
  const { rows } = await pool.query("SELECT id, ticket_char as \"ticketChar\", name, description, icon, color, expected_time_normal as \"expectedTimeNormal\", expected_time_priority as \"expectedTimePriority\", resolutions FROM categories ORDER BY id ASC");
  return rows;
}

export async function getTicketWindows(locationId?: number): Promise<{ id: number; name: string; locationId: number }[]> {
  if (locationId === undefined) {
    const { rows } = await pool.query('SELECT id, name, location_id as "locationId" FROM ticket_windows ORDER BY name ASC');
    return rows;
  }
  const { rows } = await pool.query(
    'SELECT id, name, location_id as "locationId" FROM ticket_windows WHERE location_id = $1 ORDER BY name ASC',
    [locationId]
  );
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

export async function createNextTicketWindow(locationId: number): Promise<{ id: number; name: string; locationId: number }> {
  const { rows } = await pool.query(
    `INSERT INTO ticket_windows (name, location_id)
     VALUES (
       'Guichê ' || LPAD(
         COALESCE(
           (SELECT MAX(CAST(SUBSTRING(name FROM '\\d+') AS INTEGER)) FROM ticket_windows WHERE location_id = $1) + 1, 
           1
         )::text, 
         2, 
         '0'
       ),
       $1
     )
     RETURNING id, name, location_id as "locationId"`,
     [locationId]
  );
  return rows[0];
}

export async function deleteTicketWindow(id: number): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM ticket_windows WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}

export async function getLocations() {
  const { rows } = await pool.query('SELECT id, name, is_active as "isActive", created_at as "createdAt" FROM locations ORDER BY id ASC');
  return rows;
}

export async function createLocation(name: string) {
  const { rows } = await pool.query(
    'INSERT INTO locations (name) VALUES ($1) RETURNING id, name, is_active as "isActive", created_at as "createdAt"',
    [name]
  );
  return rows[0];
}

export async function updateLocation(id: number, name: string, isActive: boolean) {
  const { rows } = await pool.query(
    'UPDATE locations SET name = $1, is_active = $2 WHERE id = $3 RETURNING id, name, is_active as "isActive", created_at as "createdAt"',
    [name, isActive, id]
  );
  return rows[0];
}

export async function deleteLocation(id: number) {
  if (id === 0) throw new Error("Não é possível excluir o local principal.");
  try {
    const { rowCount } = await pool.query("DELETE FROM locations WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23503') {
      throw new Error("Não é possível excluir o local pois existem guichês, tickets ou TVs vinculados a ele.");
    }
    throw error;
  }
}
