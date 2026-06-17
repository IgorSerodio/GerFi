export interface Ticket {
  id: string;
  type: string;
  categoryName: string;
  priority: "Normal" | "Prioritário";
  status: "pending" | "calling" | "completed";
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  attendant?: string;
  guiche?: string;
  observation?: string;
}

export interface TvSettings {
  id: number;
  mode: "live" | "files";
  liveUrl: string;
  uploadedFiles: string[];
}

export interface QueueState {
  tickets: Ticket[];
  history: Ticket[];
}

export interface User {
  id?: number;
  name: string;
  role: string;
  guiche: string;
  matricula: string;
  cpf: string;
  email: string;
  username: string;
  password?: string;
  services?: string[];
  blocked?: boolean;
}

