"use server";

import bcrypt from "bcryptjs";
import { createUser } from "@/features/queue/queries";
import { User, UserRole } from "@/features/queue/types";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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
