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
  markAsNoShow,
} from "./queries";
import { IssueTicketSchema, FinishTicketSchema, ForwardTicketSchema } from "./schema";
import { requirePermission } from "@/features/auth/actions";
import { getUserById } from "@/features/users/queries";
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
export async function getQueueStateAction(locationId: number, services?: number[]) {
  try {
    const [tickets, history] = await Promise.all([
      getActiveQueue(locationId, services),
      getHistory(locationId, services)
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
  locationId: number;
}) {
  const result = IssueTicketSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    await requirePermission("ISSUE_TICKETS");
    const ticket = await insertTicket(payload.categoryId, payload.categoryName, payload.priority, payload.locationId);
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
  locationId: number,
  attendant: string,
  guiche: string,
  allowedServices: number[],
  priorityType?: "Normal" | "Prioritário",
  isForwardedCall?: boolean
) {
  try {
    const session = await requirePermission("OPERATE_QUEUE");
    const user = await getUserById(Number(session.user.id));
    
    if (priorityType === "Normal" && user && user.canCallNormal === false) {
      return { success: false, error: "Você não tem permissão para chamar senhas Normais." };
    }
    if (priorityType === "Prioritário" && user && user.canCallPriority === false) {
      return { success: false, error: "Você não tem permissão para chamar senhas Prioritárias." };
    }

    const ticket = await callNextTicket(locationId, attendant, guiche, allowedServices, priorityType, isForwardedCall);
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
export async function finishTicketAction(ticketId: string, observation?: string, resolutions?: string[]) {
  const result = FinishTicketSchema.safeParse({ ticketId, observation, resolutions });
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    await requirePermission("OPERATE_QUEUE");
    const ticket = await finishTicket(ticketId, observation, resolutions);
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
 * Marca uma senha como não compareceu
 */
export async function noShowTicketAction(ticketId: string) {
  try {
    await requirePermission("OPERATE_QUEUE");
    const ticket = await markAsNoShow(ticketId);
    if (!ticket) {
      return { success: false, error: "Senha não encontrada." };
    }
    triggerRealTimeUpdate();
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao marcar como não compareceu.") };
  }
}

/**
 * Encaminha uma senha para outro guichê
 */
export async function forwardTicketAction(
  ticketId: string,
  targetGuiche: string
) {
  const result = ForwardTicketSchema.safeParse({ ticketId, targetGuiche });
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  try {
    await requirePermission("OPERATE_QUEUE");
    const ticket = await forwardTicket(ticketId, targetGuiche);
    if (!ticket) {
      return { success: false, error: "Senha não encontrada." };
    }
    triggerRealTimeUpdate();
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao encaminhar senha.") };
  }
}

