import { UserRole } from "@/features/queue/types";

export const PERMISSIONS = {
  ACCESS_MANAGEMENT: [UserRole.Admin, UserRole.Gerente],
  ACCESS_ATTENDANCE: [UserRole.Admin, UserRole.Atendente, UserRole.Gerente],
  ACCESS_TRIAGE:     [UserRole.Admin, UserRole.Triador, UserRole.Atendente, UserRole.Gerente],
  
  // Ações de Gerenciamento
  MANAGE_CONFIGS:    [UserRole.Admin], // Criar, editar, deletar TVs, Categorias, Guichês
  MANAGE_USERS:      [UserRole.Admin, UserRole.Gerente], // Gerenciar, editar, bloquear usuários
  
  // Ações Operacionais (Fila)
  OPERATE_QUEUE:     [UserRole.Admin, UserRole.Atendente, UserRole.Gerente], // Chamar, encaminhar, concluir senhas
  ISSUE_TICKETS:     [UserRole.Admin, UserRole.Triador, UserRole.Atendente, UserRole.Gerente], // Emitir novas senhas
} as const;

export type ActionName = keyof typeof PERMISSIONS;

export function hasPermission(action: ActionName, role?: string | UserRole | null): boolean {
  if (!role) return false;
  return (PERMISSIONS[action] as readonly string[]).includes(role);
}
