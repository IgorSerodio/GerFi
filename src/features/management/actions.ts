"use server";

import { DbCategory } from "./types";
import { requirePermission } from "@/features/auth/actions";
import { queueEmitter } from "@/infra/events";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTicketWindows,
  createNextTicketWindow,
  deleteTicketWindow,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "./queries";
import { getActiveGuiches } from "@/features/users/queries";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function triggerRealTimeUpdate() {
  queueEmitter.emit("update");
}

export async function getCategoriesAction() {
  try {
    const categories = await getCategories();
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar categorias.") };
  }
}

export async function getTicketWindowsAction(locationId?: number) {
  try {
    const ticketWindows = await getTicketWindows(locationId);
    return { success: true, data: ticketWindows };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar guichês.") };
  }
}

export async function getActiveGuichesAction() {
  try {
    await requirePermission("OPERATE_QUEUE");
    const active = await getActiveGuiches();
    return { success: true, data: active };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar guichês ativos.") };
  }
}

export async function createCategoryAction(data: Omit<DbCategory, "id">) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const category = await createCategory(data);
    triggerRealTimeUpdate();
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar serviço.") };
  }
}

export async function updateCategoryAction(id: number, data: Partial<DbCategory>) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const category = await updateCategory(id, data);
    triggerRealTimeUpdate();
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar serviço.") };
  }
}

export async function deleteCategoryAction(id: number) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const success = await deleteCategory(id);
    triggerRealTimeUpdate();
    return { success };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir serviço.") };
  }
}

export async function createNextTicketWindowAction(locationId: number) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const window = await createNextTicketWindow(locationId);
    triggerRealTimeUpdate();
    return { success: true, data: window };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar guichê.") };
  }
}

export async function deleteTicketWindowAction(id: number) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const success = await deleteTicketWindow(id);
    triggerRealTimeUpdate();
    return { success };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir guichê.") };
  }
}

export async function getLocationsAction() {
  try {
    const locations = await getLocations();
    return { success: true, data: locations };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar locais.") };
  }
}

export async function createLocationAction(name: string) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const location = await createLocation(name);
    return { success: true, data: location };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar local.") };
  }
}

export async function updateLocationAction(id: number, name: string, isActive: boolean) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const location = await updateLocation(id, name, isActive);
    return { success: true, data: location };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar local.") };
  }
}

export async function deleteLocationAction(id: number) {
  try {
    await requirePermission("MANAGE_CONFIGS");
    const success = await deleteLocation(id);
    return { success };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir local.") };
  }
}
