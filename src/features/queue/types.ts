export interface Ticket {
  id: string;
  ticketNumber: string;
  categoryId: number;
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

export interface YouTubeVideo {
  url: string;
  videoId: string;
  title: string;
}

export interface TvSettings {
  id: number;
  mode: "live" | "files";
  videoUrl: YouTubeVideo[];
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
  guiche?: string | null;
  matricula: string;
  cpf: string;
  email: string;
  username: string;
  password?: string;
  services?: number[];
  blocked?: boolean;
}

export interface DbCategory {
  id: number;
  ticketChar: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface DbTicketWindow {
  id: number;
  name: string;
}
