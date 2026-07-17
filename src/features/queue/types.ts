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

