export type TicketStatus = "pending" | "calling" | "started" | "completed" | "no_show" | "forwarded";

export interface Ticket {
  id: string;
  ticketNumber: string;
  categoryId: number;
  categoryName: string;
  priority: "Normal" | "Prioritário";
  status: TicketStatus;
  createdAt: string;
  calledAt?: string | null;
  completedAt?: string | null;
  attendantId?: number | null;
  attendantName?: string | null;
  ticketWindowId?: number | null;
  guicheName?: string;
  guicheAlias?: string;
  observation?: string | null;
  locationId: number;
  securityCode?: string;
  startedAt?: string;
  resolutions?: string[];
  recallHistory?: string[];
  forwardedTo?: string | number;
  forwardType?: "single" | "group";
}

export interface QueueState {
  tickets: Ticket[];
  history: Ticket[];
}

