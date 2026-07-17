export type ViewType = "menu" | "dashboard" | "reports" | "config_hub" | "config_users" | "config_tv" | "config_printer" | "config_services" | "config_locations";

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

export interface Location {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}
