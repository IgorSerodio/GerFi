import { UserRole } from "@/features/queue/types";

export const PERMISSIONS = {
  ACCESS_MANAGEMENT: [UserRole.Admin, UserRole.Gerente],
  ACCESS_ATTENDANCE: [UserRole.Admin, UserRole.Atendente, UserRole.Gerente],
  ACCESS_TRIAGE:     [UserRole.Admin, UserRole.Triador, UserRole.Atendente, UserRole.Gerente],
  MANAGE_CONFIGS:    [UserRole.Admin],
} as const;

export type ActionName = keyof typeof PERMISSIONS;

export function hasPermission(action: ActionName, role?: string | UserRole | null): boolean {
  if (!role) return false;
  return (PERMISSIONS[action] as readonly string[]).includes(role);
}
