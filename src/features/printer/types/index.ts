import { Ticket } from "@/features/queue/types";

export interface IPrinterService {
  /**
   * Dispara a impressão de um ticket.
   * @param ticket Dados do ticket a ser impresso.
   * @returns Promise indicando o sucesso da operação.
   */
  printTicket(ticket: Ticket, locationName?: string): Promise<boolean>;
}

export type PaperSize = "58mm" | "80mm";

export interface PrinterConfig {
  paperSize: PaperSize;
  printBarcode: boolean;
  autocut: boolean;
  soundAlert: boolean;
}
