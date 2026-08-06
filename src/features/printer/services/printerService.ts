import { IPrinterService } from "../types";
import { BrowserPrintStrategy } from "./strategies/browserPrintStrategy";

class PrinterService {
  private strategy: IPrinterService;

  constructor() {
    this.strategy = new BrowserPrintStrategy();
  }

  public async printTicket(...args: Parameters<IPrinterService["printTicket"]>) {
    return this.strategy.printTicket(...args);
  }

  // Gera e imprime um ticket de teste genérico
  public async printTestTicket(locationId: number = 1) {
    const testTicket = {
      id: "test",
      ticketNumber: "TESTE-01",
      categoryId: 999,
      categoryName: "TESTE DE IMPRESSORA",
      priority: "Normal" as const,
      status: "pending" as const,
      locationId,
      createdAt: new Date().toISOString(),
      securityCode: "1234",
    };
    
    return this.strategy.printTicket(testTicket as Parameters<IPrinterService["printTicket"]>[0]);
  }

  public setStrategy(strategy: IPrinterService) {
    this.strategy = strategy;
  }
}

export const printerService = new PrinterService();
