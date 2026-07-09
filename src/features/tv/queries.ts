import { pool } from "@/infra/database";
import { TvSettings, YouTubeVideo } from "./types";

interface DbTvSettingsRow {
  id: number;
  slug: string;
  name: string;
  mode: "live" | "files";
  live_url: string;
  uploaded_files: string[] | string | null;
  services: number[];
  location_id: number;
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
    locationId: row.location_id || 0,
  };
}

/**
 * Obtém as configurações de uma TV específica pelo slug
 */
export async function getTvSettings(slug: string = "global"): Promise<TvSettings> {
  const { rows } = await pool.query("SELECT * FROM tv_settings WHERE slug = $1", [slug]);
  if (rows.length === 0) {
    if (slug === "global") {
      return { id: 1, slug: "global", name: "TV Principal", mode: "live", videoUrl: [], uploadedFiles: [], services: [], locationId: 0 };
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
  services: number[],
  locationId: number
): Promise<TvSettings> {
  const { rows } = await pool.query(
    `INSERT INTO tv_settings (slug, name, mode, live_url, uploaded_files, services, location_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [slug, name, mode, JSON.stringify(videoUrl), JSON.stringify(uploadedFiles), services, locationId]
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
  services: number[],
  locationId: number
): Promise<TvSettings> {
  const { rows } = await pool.query(
    `UPDATE tv_settings
     SET slug = $1,
         name = $2,
         mode = $3,
         live_url = $4,
         uploaded_files = $5,
         services = $6,
         location_id = $7
     WHERE id = $8
     RETURNING *`,
    [slug, name, mode, JSON.stringify(videoUrl), JSON.stringify(uploadedFiles), services, locationId, id]
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
