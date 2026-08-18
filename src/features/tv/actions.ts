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

import { getErrorMessage } from "@/lib/errors";

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
