import { pool } from "@/infra/database";
import { AppError } from "@/lib/errors";
import { TvSettings, YouTubeVideo } from "./types";

interface DbTvSettingsRow {
  id: number;
  slug: string;
  name: string;
  mode: "channel" | "playlist" | "slides";
  live_url: string;
  youtube_channel: string | null;
  uploaded_files: string[] | string | null;
  services: number[];
  location_id: number;
  marquee_messages?: string[] | string | null;
  slides?: { title: string; text: string; type: string }[] | string | null;
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

  let marqueeMessages: string[] = [];
  if (Array.isArray(row.marquee_messages)) {
    marqueeMessages = row.marquee_messages;
  } else if (typeof row.marquee_messages === "string") {
    try { marqueeMessages = JSON.parse(row.marquee_messages); } catch { marqueeMessages = []; }
  }

  let slides: { title: string; text: string; type: string }[] = [];
  if (Array.isArray(row.slides)) {
    slides = row.slides;
  } else if (typeof row.slides === "string") {
    try { slides = JSON.parse(row.slides); } catch { slides = []; }
  }

  return {
    id: row.id,
    slug: row.slug || "global",
    name: row.name || "TV",
    mode: row.mode,
    youtubeChannel: row.youtube_channel || undefined,
    videoUrl,
    uploadedFiles,
    services: row.services || [],
    locationId: row.location_id || 1,
    marqueeMessages,
    slides,
  };
}

/**
 * Obtém as configurações de uma TV específica pelo slug
 */
export async function getTvSettings(slug: string = "global"): Promise<TvSettings> {
  const { rows } = await pool.query("SELECT * FROM tv_settings WHERE slug = $1", [slug]);
  if (rows.length === 0) {
    if (slug === "global") {
      return { id: 1, slug: "global", name: "TV Principal", mode: "playlist", videoUrl: [], uploadedFiles: [], services: [], locationId: 1, marqueeMessages: [], slides: [] };
    }
    throw new AppError("TV não encontrada.");
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
  mode: "channel" | "playlist" | "slides",
  youtubeChannel: string | undefined,
  videoUrl: YouTubeVideo[],
  uploadedFiles: string[],
  services: number[],
  locationId: number,
  marqueeMessages: string[] = [],
  slides: { title: string; text: string; type: string }[] = []
): Promise<TvSettings> {
  const { rows } = await pool.query(
    `INSERT INTO tv_settings (slug, name, mode, youtube_channel, live_url, uploaded_files, services, location_id, marquee_messages, slides)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [slug, name, mode, youtubeChannel, JSON.stringify(videoUrl), JSON.stringify(uploadedFiles), services, locationId, JSON.stringify(marqueeMessages), JSON.stringify(slides)]
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
  mode: "channel" | "playlist" | "slides",
  youtubeChannel: string | undefined,
  videoUrl: YouTubeVideo[],
  uploadedFiles: string[],
  services: number[],
  locationId: number,
  marqueeMessages: string[] = [],
  slides: { title: string; text: string; type: string }[] = []
): Promise<TvSettings> {
  const { rows } = await pool.query(
    `UPDATE tv_settings
     SET slug = $1,
         name = $2,
         mode = $3,
         youtube_channel = $4,
         live_url = $5,
         uploaded_files = $6,
         services = $7,
         location_id = $8,
         marquee_messages = $9,
         slides = $10
     WHERE id = $11
     RETURNING *`,
    [slug, name, mode, youtubeChannel, JSON.stringify(videoUrl), JSON.stringify(uploadedFiles), services, locationId, JSON.stringify(marqueeMessages), JSON.stringify(slides), id]
  );
  return mapTvSettingsRow(rows[0]);
}

/**
 * Exclui uma TV
 */
export async function deleteTvSettings(id: number): Promise<boolean> {
  // Não permitir exclusão da TV global
  if (id === 1) throw new AppError("A TV Principal não pode ser excluída.");
  const { rowCount } = await pool.query("DELETE FROM tv_settings WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
