"use server";

import {
  insertTicket,
  callNextTicket,
  getTicketById,
  finishTicket,
  forwardTicket,
  getActiveQueue,
  getHistory,
  getTvSettings,
  getAllTvSettings,
  createTvSettings,
  updateTvSettings,
  deleteTvSettings,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleBlockUser,
  getCategories,
  getTicketWindows,
  createCategory,
  updateCategory,
  deleteCategory,
  createNextTicketWindow,
  deleteTicketWindow,
} from "./queries";
import { DbCategory } from "./types";
import { IssueTicketSchema, FinishTicketSchema, ForwardTicketSchema, TvSettingsSchema } from "./schema";
import { queueEmitter } from "@/infra/events";
import { User, YouTubeVideo } from "./types";
import bcrypt from "bcryptjs";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Dispara notificação em tempo real
 */
function triggerRealTimeUpdate() {
  // O trigger do Postgres já envia NOTIFY, mas emitimos localmente 
  // para garantir sincronismo instantâneo em ambientes locais ou single-instance.
  queueEmitter.emit("update");
}

/**
 * Obtém o estado atualizado da fila (senhas ativas e histórico)
 */
export async function getQueueStateAction(services?: number[]) {
  try {
    const [tickets, history] = await Promise.all([
      getActiveQueue(services),
      getHistory(services)
    ]);
    return { success: true, data: { tickets, history } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao carregar fila.") };
  }
}

/**
 * Emite uma nova senha na Triagem
 */
export async function issueTicketAction(payload: {
  categoryId: number;
  categoryName: string;
  priority: "Normal" | "Prioritário";
}) {
  const result = IssueTicketSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    const ticket = await insertTicket(payload.categoryId, payload.categoryName, payload.priority);
    triggerRealTimeUpdate();
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao emitir senha.") };
  }
}

/**
 * Atendente chama a próxima senha disponível
 */
export async function callTicketAction(
  attendant: string,
  guiche: string,
  allowedServices: number[]
) {
  try {
    const ticket = await callNextTicket(attendant, guiche, allowedServices);
    if (!ticket) {
      return { success: true, data: null }; // Sem senhas na fila
    }
    triggerRealTimeUpdate();
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao chamar senha.") };
  }
}

/**
 * Re-chama uma senha no Painel (ativa alerta sonoro na TV)
 */
export async function recallTicketAction(ticketId: string) {
  try {
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      return { success: false, error: "Senha não encontrada." };
    }
    
    // Forçar a TV a re-exibir e re-tocar o áudio emitindo um sinal específico
    queueEmitter.emit("update"); // Atualiza o histórico e re-sincroniza a chamada
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao rechamar senha.") };
  }
}

/**
 * Conclui um atendimento
 */
export async function finishTicketAction(ticketId: string, observation?: string) {
  const result = FinishTicketSchema.safeParse({ ticketId, observation });
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    const ticket = await finishTicket(ticketId, observation);
    if (!ticket) {
      return { success: false, error: "Senha não encontrada." };
    }
    triggerRealTimeUpdate();
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao concluir senha.") };
  }
}

/**
 * Encaminha uma senha para outro guichê
 */
export async function forwardTicketAction(
  ticketId: string,
  targetGuiche: string,
  attendant: string
) {
  const result = ForwardTicketSchema.safeParse({ ticketId, targetGuiche });
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    const ticket = await forwardTicket(ticketId, targetGuiche, attendant);
    if (!ticket) {
      return { success: false, error: "Senha não encontrada." };
    }
    triggerRealTimeUpdate();
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao encaminhar senha.") };
  }
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
  mode: "live" | "files";
  videoUrl: YouTubeVideo[];
  uploadedFiles?: string[];
  services?: number[];
}) {
  // Poderiamos adicionar TvSettingsSchema validando slug e name
  try {
    const settings = await createTvSettings(
      payload.slug,
      payload.name,
      payload.mode,
      payload.videoUrl,
      payload.uploadedFiles || [],
      payload.services || []
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
  mode: "live" | "files";
  videoUrl: YouTubeVideo[];
  uploadedFiles?: string[];
  services?: number[];
}) {
  try {
    const settings = await updateTvSettings(
      payload.id,
      payload.slug,
      payload.name,
      payload.mode,
      payload.videoUrl,
      payload.uploadedFiles || [],
      payload.services || []
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
    const success = await deleteTvSettings(id);
    triggerRealTimeUpdate();
    return { success };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir TV.") };
  }
}

/**
 * Busca todos os usuários
 */
export async function getUsersAction() {
  try {
    const users = await getUsers();
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar servidores.") };
  }
}

/**
 * Cria um usuário
 */
export async function createUserAction(userData: Omit<User, "id">) {
  try {
    // Hash password before saving
    const hashedPassword = bcrypt.hashSync(userData.password || "", 10);
    const user = await createUser({
      ...userData,
      password: hashedPassword,
    });
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar servidor.") };
  }
}

/**
 * Atualiza um usuário
 */
export async function updateUserAction(id: number, userData: Partial<User>) {
  try {
    const updatedData = { ...userData };
    if (userData.password) {
      updatedData.password = bcrypt.hashSync(userData.password, 10);
    }
    const user = await updateUser(id, updatedData);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar servidor.") };
  }
}

/**
 * Exclui um usuário
 */
export async function deleteUserAction(id: number) {
  try {
    const success = await deleteUser(id);
    return { success };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir servidor.") };
  }
}

/**
 * Bloqueia/Desbloqueia um usuário
 */
export async function toggleBlockUserAction(id: number) {
  try {
    const user = await toggleBlockUser(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao alterar bloqueio.") };
  }
}

/**
 * Busca todas as categorias (serviços) do banco
 */
export async function getCategoriesAction() {
  try {
    const categories = await getCategories();
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar categorias.") };
  }
}

/**
 * Busca todos os guichês (ticket windows) do banco
 */
export async function getTicketWindowsAction() {
  try {
    const ticketWindows = await getTicketWindows();
    return { success: true, data: ticketWindows };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar guichês.") };
  }
}

/**
 * Cria uma nova categoria
 */
export async function createCategoryAction(data: Omit<DbCategory, "id">) {
  try {
    const category = await createCategory(data);
    triggerRealTimeUpdate();
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar serviço.") };
  }
}

/**
 * Atualiza uma categoria
 */
export async function updateCategoryAction(id: number, data: Partial<DbCategory>) {
  try {
    const category = await updateCategory(id, data);
    triggerRealTimeUpdate();
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar serviço.") };
  }
}

/**
 * Exclui uma categoria
 */
export async function deleteCategoryAction(id: number) {
  try {
    const success = await deleteCategory(id);
    triggerRealTimeUpdate();
    return { success };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir serviço.") };
  }
}

/**
 * Cria o próximo guichê sequencial
 */
export async function createNextTicketWindowAction() {
  try {
    const window = await createNextTicketWindow();
    triggerRealTimeUpdate();
    return { success: true, data: window };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao criar guichê.") };
  }
}

/**
 * Exclui um guichê
 */
export async function deleteTicketWindowAction(id: number) {
  try {
    const success = await deleteTicketWindow(id);
    triggerRealTimeUpdate();
    return { success };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir guichê.") };
  }
}
