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
  updateTvSettings,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleBlockUser,
} from "./queries";
import { IssueTicketSchema, FinishTicketSchema, ForwardTicketSchema, TvSettingsSchema } from "./schema";
import { queueEmitter } from "@/infra/events";
import { User } from "./types";
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
export async function getQueueStateAction() {
  try {
    const [tickets, history] = await Promise.all([
      getActiveQueue(),
      getHistory()
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
  type: string;
  categoryName: string;
  priority: "Normal" | "Prioritário";
}) {
  const result = IssueTicketSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    const ticket = await insertTicket(payload.type, payload.categoryName, payload.priority);
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
  allowedServices: string[]
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
 * Busca configurações da TV
 */
export async function getTvSettingsAction() {
  try {
    const settings = await getTvSettings();
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar configurações da TV.") };
  }
}

/**
 * Atualiza configurações da TV
 */
export async function updateTvSettingsAction(payload: {
  mode: "live" | "files";
  liveUrl: string;
  uploadedFiles?: string[];
}) {
  const result = TvSettingsSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    const settings = await updateTvSettings(payload.mode, payload.liveUrl, payload.uploadedFiles || []);
    triggerRealTimeUpdate();
    return { success: true, data: settings };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao atualizar TV.") };
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

