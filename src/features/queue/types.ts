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
  securityCode?: string;
  startedAt?: string;
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
}

export interface DbTicketWindow {
  id: number;
  name: string;
}
