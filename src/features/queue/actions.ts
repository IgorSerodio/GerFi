"use server";

import {
  insertTicket,
  callNextTicket,
  getTicketById,
  startTicket,
  finishTicket,
  forwardTicket,
  getActiveQueue,
  getHistory,
  getCategories,
  getTicketWindows,
  createCategory,
  updateCategory,
  deleteCategory,
  createNextTicketWindow,
  deleteTicketWindow,
} from "./queries";
import { DbCategory } from "./types";
import { IssueTicketSchema, FinishTicketSchema, ForwardTicketSchema } from "./schema";
import { requirePermission } from "@/features/auth/actions";
import { queueEmitter } from "@/infra/events";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Dispara notificação em tempo real
 */
function triggerRealTimeUpdate() {
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
    await requirePermission("ISSUE_TICKETS");
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
  allowedServices: number[],
  priorityType?: "Normal" | "Prioritário"
) {
  try {
    await requirePermission("OPERATE_QUEUE");
    const ticket = await callNextTicket(attendant, guiche, allowedServices, priorityType);
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
    await requirePermission("OPERATE_QUEUE");
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
 * Inicializa uma senha mediante código
 */
export async function startTicketAction(ticketId: string, code: string) {
  try {
    await requirePermission("OPERATE_QUEUE");
    if (!code || code.length !== 4) {
      return { success: false, error: "O código deve ter 4 letras." };
    }
    const res = await startTicket(ticketId, code);
    if (!res.success) {
      return res;
    }
    triggerRealTimeUpdate();
    return res;
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao inicializar senha.") };
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
    await requirePermission("OPERATE_QUEUE");
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
    await requirePermission("OPERATE_QUEUE");
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
    await requirePermission("MANAGE_CONFIGS");
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
    await requirePermission("MANAGE_CONFIGS");
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
    await requirePermission("MANAGE_CONFIGS");
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
    await requirePermission("MANAGE_CONFIGS");
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
    await requirePermission("MANAGE_CONFIGS");
    const success = await deleteTicketWindow(id);
    triggerRealTimeUpdate();
    return { success };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao excluir guichê.") };
  }
}
