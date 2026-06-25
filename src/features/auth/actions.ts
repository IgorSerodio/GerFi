"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ActionName, hasPermission } from "./permissions";
import { createUser, getUserByEmail, setUserResetPin, clearUserResetPinAndUpdatePassword } from "@/features/queue/queries";
import { User, UserRole } from "@/features/queue/types";
import { sendPasswordRecoveryEmail } from "./email";

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

/**
 * Solicita a recuperação de senha gerando um PIN
 */
export async function requestPasswordResetAction(email: string) {
  try {
    const user = await getUserByEmail(email);

    if (!user || user.blocked) {
      // Simula atraso para evitar enumeração de usuários
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } else {
      // Gera PIN de 6 dígitos
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Expira em 5 minutos
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      await setUserResetPin(user.id, pin, expiresAt);
      
      // Envia o e-mail (ou simula)
      await sendPasswordRecoveryEmail(email, pin);
    }

    // Mensagem genérica de sucesso independente do e-mail existir ou estar bloqueado
    return { 
      success: true, 
      message: "Se o e-mail estiver correto e ativo, um PIN de recuperação foi enviado." 
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao processar solicitação.") };
  }
}

/**
 * Redefine a senha validando o PIN
 */
export async function resetPasswordWithPinAction(email: string, pin: string, newPassword: string) {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return { success: false, error: "E-mail ou PIN inválidos." };
    }

    if (!user.reset_pin || user.reset_pin !== pin) {
      return { success: false, error: "E-mail ou PIN inválidos." };
    }

    if (user.reset_pin_expires && new Date(user.reset_pin_expires) < new Date()) {
      return { success: false, error: "O PIN de recuperação expirou. Solicite um novo." };
    }

    // PIN válido, atualiza senha e limpa PIN
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await clearUserResetPinAndUpdatePassword(user.id, hashedPassword);

    return { success: true, message: "Senha redefinida com sucesso." };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao redefinir a senha.") };
  }
}
