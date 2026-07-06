export enum UserRole {
  Atendente = "Atendente",
  Gerente = "Gerente",
  Triador = "Triador",
  Admin = "Admin",
}

export interface User {
  id?: number;
  name: string;
  role: UserRole;
  guiche?: string | null;
  matricula: string;
  cpf: string;
  email: string;
  username: string;
  password?: string;
  services?: number[];
  blocked?: boolean;
  canCallNormal?: boolean;
  canCallPriority?: boolean;
}
