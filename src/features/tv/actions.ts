"use server";

import {
  getTvSettings,
  getAllTvSettings,
  createTvSettings,
  updateTvSettings,
  deleteTvSettings,
} from "./queries";
import { requirePermission } from "@/features/auth/actions";
import { queueEmitter } from "@/infra/events";
import { YouTubeVideo } from "./types";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function triggerRealTimeUpdate() {
  queueEmitter.emit("update");
}

/**
 * Busca configurações de uma TV pelo slug
 */
export async function getTvSettingsAction(slug: string = "global") {
  try {
    const settings = await getTvSettings(slug);
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar configurações da TV.") };
  }
}

/**
 * Busca todas as TVs
 */
export async function getAllTvSettingsAction() {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const settings = await getAllTvSettings();
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar todas as TVs.") };
  }
}

/**
 * Cria uma nova TV
 */
export async function createTvSettingsAction(payload: {
  slug: string;
  name: string;
  mode: "channel" | "playlist" | "slides";
  youtubeChannel?: string;
  videoUrl: YouTubeVideo[];
  uploadedFiles?: string[];
  services?: number[];
  locationId: number;
  marqueeMessages?: string[];
  slides?: { title: string; text: string; type: string }[];
}) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const settings = await createTvSettings(
      payload.slug,
      payload.name,
      payload.mode,
      payload.youtubeChannel,
      payload.videoUrl,
      payload.uploadedFiles || [],
      payload.services || [],
      payload.locationId,
      payload.marqueeMessages || [],
      payload.slides || []
    );
    triggerRealTimeUpdate();
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar TV.") };
  }
}

/**
 * Atualiza configurações de uma TV
 */
export async function updateTvSettingsAction(payload: {
  id: number;
  slug: string;
  name: string;
  mode: "channel" | "playlist" | "slides";
  youtubeChannel?: string;
  videoUrl: YouTubeVideo[];
  uploadedFiles?: string[];
  services?: number[];
  locationId: number;
  marqueeMessages?: string[];
  slides?: { title: string; text: string; type: string }[];
}) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const settings = await updateTvSettings(
      payload.id,
      payload.slug,
      payload.name,
      payload.mode,
      payload.youtubeChannel,
      payload.videoUrl,
      payload.uploadedFiles || [],
      payload.services || [],
      payload.locationId,
      payload.marqueeMessages || [],
      payload.slides || []
    );
    triggerRealTimeUpdate();
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar TV.") };
  }
}

/**
 * Exclui uma TV
 */
export async function deleteTvSettingsAction(id: number) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const success = await deleteTvSettings(id);
    triggerRealTimeUpdate();
    return { success };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir TV.") };
  }
}

/**
 * Resolve a URL do canal do YouTube (ex: @NomeDoCanal) para obter IDs de playlist e live
 */
export async function resolveYoutubeChannelAction(channelUrl: string) {
  try {
    const res = await fetch(channelUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    const html = await res.text();
    let channelId = null;
    const idMatch1 = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
    const idMatch2 = html.match(/<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]+)"/);
    const idMatch3 = html.match(/"browseId":"(UC[a-zA-Z0-9_-]+)"/);
    
    if (idMatch1) channelId = idMatch1[1];
    else if (idMatch2) channelId = idMatch2[1];
    else if (idMatch3) channelId = idMatch3[1];

    const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i) || html.match(/<title>([^<]+)<\/title>/i);
    const imageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    
    if (channelId) {
      const playlistId = "UU" + channelId.substring(2);
      return {
        success: true,
        data: {
          channelId,
          liveUrl: `https://www.youtube.com/embed/live_stream?channel=${channelId}`,
          playlistId,
          title: titleMatch ? titleMatch[1] : undefined,
          avatarUrl: imageMatch ? imageMatch[1] : undefined
        }
      };
    }
    return { success: false, error: "Canal não encontrado ou URL inválida." };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar canal.") };
  }
}

/**
 * Checa se um canal do YouTube está genuinamente ao vivo neste momento.
 */
export async function checkYoutubeLiveStatusAction(channelId: string) {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    const html = await res.text();
    const isLiveNow = html.includes('"isLiveNow":true') || html.includes('isLiveBroadcast');
    
    return { success: true, isLive: isLiveNow };
  } catch (error) {
    return { success: false, isLive: false };
  }
}
