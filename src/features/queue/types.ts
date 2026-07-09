export interface Ticket {
  id: string;
  ticketNumber: string;
  categoryId: number;
  categoryName: string;
  priority: "Normal" | "Prioritário";
  status: "pending" | "calling" | "started" | "completed" | "no_show" | "forwarded";
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  attendant?: string;
  guiche?: string;
  observation?: string;
  locationId: number;
  securityCode?: string;
  startedAt?: string;
  resolutions?: string[];
  recallHistory?: string[];
  forwardedTo?: string;
}

export interface QueueState {
  tickets: Ticket[];
  history: Ticket[];
}

export interface DbCategory {
  id: number;
  ticketChar: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  expectedTimeNormal: number;
  expectedTimePriority: number;
  resolutions: string[];
}

export interface DbTicketWindow {
  id: number;
  name: string;
  locationId: number;
}

export interface TvSetting {
  id: number;
  slug: string;
  name: string;
  mode: "live" | "files";
  liveUrl: string;
  uploadedFiles: string[];
  services: number[];
  locationId: number;
}

export interface Location {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}
