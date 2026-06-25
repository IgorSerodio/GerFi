"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ActionName, hasPermission } from "./permissions";
import { createUser } from "@/features/queue/queries";
import { User, UserRole } from "@/features/queue/types";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Valida a sessão e a permissão do usuário de forma rigorosa.
 * Pode ser invocada no topo de qualquer Server Action.
 */
export async function requirePermission(action: ActionName) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    throw new Error("Não autenticado. Você precisa fazer login para realizar esta ação.");
  }
  
  if (!hasPermission(action, session.user.role)) {
    throw new Error("Acesso negado. Você não tem permissão para realizar esta ação.");
  }
  
  return session;
}

/**
 * Registra um novo usuário.
 * Aplica regra de negócios:
 * - Senha faz hash
 * - A role "Admin" é estritamente proibida
 * - O usuário já entra como bloqueado (blocked: true)
 */
export async function registerUserAction(userData: Omit<User, "id" | "blocked">) {
  try {
    // Segurança: Garantir que Admin não possa ser escolhido via form malicioso
    if (userData.role === UserRole.Admin) {
      return { success: false, error: "Cadastro com papel Admin não é permitido." };
    }

    // Hash password before saving
    const hashedPassword = bcrypt.hashSync(userData.password || "", 10);
    
    const user = await createUser({
      ...userData,
      password: hashedPassword,
      blocked: true, // Auto-cadastro força bloqueio até liberação pelo Admin
    });
    
    return { success: true, data: user };
  } catch (error) {
    // Retornar um erro genérico (ou tratar erros de unique username/cpf)
    return { success: false, error: getErrorMessage(error, "Erro ao registrar usuário. Verifique se o CPF ou usuário já existem.") };
  }
}
