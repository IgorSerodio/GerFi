"use server";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleBlockUser,
  getUserById,
  updateUserServices,
  updateUserGuiche,
} from "./queries";
import { queueEmitter } from "@/infra/events";
import { requirePermission } from "@/features/auth/actions";
import { User, UserRole } from "./types";
import bcrypt from "bcryptjs";
import { isValidEmail, isValidCpf, isValidMatricula } from "@/lib/validators";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Busca todos os usuários
 */
export async function getUsersAction() {
  try {
    const session = await requirePermission("MANAGE_USERS");
    const users = await getUsers();
    if (session.user.role === UserRole.Gerente) {
      return { success: true, data: users.filter((u: User) => u.role !== UserRole.Admin) };
    }
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
    const session = await requirePermission("MANAGE_USERS");
    
    if (session.user.role === UserRole.Gerente) {
      if (userData.role === UserRole.Admin || userData.role === UserRole.Gerente) {
        return { success: false, error: "Gerentes não podem criar usuários com perfil de Admin ou Gerente." };
      }
    }

    if (!userData.email || !isValidEmail(userData.email)) {
      return { success: false, error: "O formato do e-mail é inválido." };
    }
    if (!userData.cpf || !isValidCpf(userData.cpf)) {
      return { success: false, error: "O CPF deve conter exatamente 11 dígitos numéricos." };
    }
    if (!userData.matricula || !isValidMatricula(userData.matricula)) {
      return { success: false, error: "A matrícula deve conter exatamente 6 dígitos numéricos." };
    }

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
    const session = await requirePermission("MANAGE_USERS");
    
    if (session.user.role === UserRole.Gerente) {
      const targetUser = await getUserById(id);
      if (!targetUser) return { success: false, error: "Usuário não encontrado." };
      if (targetUser.role === UserRole.Admin || targetUser.role === UserRole.Gerente) {
        return { success: false, error: "Gerentes não podem editar Admins ou outros Gerentes." };
      }
      if (userData.role === UserRole.Admin || userData.role === UserRole.Gerente) {
        return { success: false, error: "Gerentes não podem promover usuários para Admin ou Gerente." };
      }
    }
    
    if (userData.email !== undefined && !isValidEmail(userData.email)) {
      return { success: false, error: "O formato do e-mail é inválido." };
    }
    if (userData.cpf !== undefined && !isValidCpf(userData.cpf)) {
      return { success: false, error: "O CPF deve conter exatamente 11 dígitos numéricos." };
    }
    if (userData.matricula !== undefined && !isValidMatricula(userData.matricula)) {
      return { success: false, error: "A matrícula deve conter exatamente 6 dígitos numéricos." };
    }

    const updatedData = { ...userData };
    if (userData.password) {
      updatedData.password = bcrypt.hashSync(userData.password, 10);
    }
    const user = await updateUser(id, updatedData);
    
    // Notify clients to refresh their queues and their updated service profiles
    queueEmitter.emit("update");

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
    const session = await requirePermission("MANAGE_USERS");
    if (session.user.role === UserRole.Gerente) {
      return { success: false, error: "Gerentes não têm permissão para excluir usuários." };
    }
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
    const session = await requirePermission("MANAGE_USERS");
    if (session.user.role === UserRole.Gerente) {
      const targetUser = await getUserById(id);
      if (!targetUser) return { success: false, error: "Usuário não encontrado." };
      if (targetUser.role === UserRole.Admin || targetUser.role === UserRole.Gerente) {
        return { success: false, error: "Gerentes não podem alterar o bloqueio de Admins ou Gerentes." };
      }
    }
    const user = await toggleBlockUser(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao alterar bloqueio.") };
  }
}

/**
 * Busca o perfil do usuário logado atual
 */
export async function getMyProfileAction() {
  try {
    const session = await requirePermission("ACCESS_ATTENDANCE");
    const user = await getUserById(Number(session.user.id));
    if (!user) return { success: false, error: "Usuário não encontrado." };
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao buscar perfil.") };
  }
}

/**
 * Atualiza os serviços do usuário logado (Usado na aba 'Meus Serviços')
 */
export async function updateMyServicesAction(services: number[]) {
  try {
    const session = await requirePermission("ACCESS_ATTENDANCE");
    const user = await updateUserServices(Number(session.user.id), services);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao salvar serviços.") };
  }
}

/**
 * Atualiza o guichê do usuário logado
 */
export async function updateMyGuicheAction(guiche: string | null) {
  try {
    const session = await requirePermission("ACCESS_ATTENDANCE");
    const user = await updateUserGuiche(Number(session.user.id), guiche);
    queueEmitter.emit("update");
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao alterar guichê.") };
  }
}
