import React from "react";
import { Ticket as TicketType, TicketStatus } from "@/features/queue/types";

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

export type SearchResult =
  | {
      id: string;
      status: "pending";
      ahead: number;
      normalAhead: number;
      priorityAhead: number;
      ticket: TicketType;
    }
  | {
      id: string;
      status: Exclude<TicketStatus, "pending">;
      guiche?: string;
      guicheAlias?: string;
      attendantName?: string;
      ticket: TicketType;
    }
  | {
      id: string;
      status: "not_found";
    };
