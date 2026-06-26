"use server";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleBlockUser,
} from "./queries";
import { requirePermission } from "@/features/auth/actions";
import { User } from "./types";
import bcrypt from "bcryptjs";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Busca todos os usuários
 */
export async function getUsersAction() {
  try {
    await requirePermission("MANAGE_USERS");
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
    await requirePermission("MANAGE_USERS");
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
    await requirePermission("MANAGE_USERS");
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
    await requirePermission("MANAGE_USERS");
    const user = await toggleBlockUser(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao alterar bloqueio.") };
  }
}
