import React from "react";
import PriorityModal from "./modals/PriorityModal";
import PrinterTestModal from "./modals/PrinterTestModal";
import TicketReceiptModal from "./modals/TicketReceiptModal";
import PrinterConfigModal from "./modals/PrinterConfigModal";

import { Category } from "./types";
import { Ticket as TicketType } from "@/features/queue/types";

interface TriageModalsProps {
  state: {
    selectedCategory: Category | null;
    showPrinterTest: boolean;
    showPrinterConfig?: boolean;
    printerStatus: "idle" | "testing" | "success" | "error";
    issuedTicket: TicketType | null;
    printing: boolean;
  };
  actions: {
    setSelectedCategory: (v: Category | null) => void;
    handleIssue: (priority: "Normal" | "Prioritário") => Promise<void>;
    setShowPrinterTest: (v: boolean) => void;
    setShowPrinterConfig?: (v: boolean) => void;
    setIssuedTicket: (t: TicketType | null) => void;
  };
}

export default function TriageModals({ state, actions }: TriageModalsProps) {
  return (
    <>
      <PriorityModal
        selectedCategory={state.selectedCategory}
        onClose={() => actions.setSelectedCategory(null)}
        onIssue={actions.handleIssue}
      />

      <PrinterTestModal
        show={state.showPrinterTest}
        onClose={() => actions.setShowPrinterTest(false)}
        printerStatus={state.printerStatus}
      />

      <TicketReceiptModal
        issuedTicket={state.issuedTicket}
        onClose={() => actions.setIssuedTicket(null)}
      />

      {actions.setShowPrinterConfig && (
        <PrinterConfigModal
          isOpen={state.showPrinterConfig || false}
          onClose={() => actions.setShowPrinterConfig!(false)}
        />
      )}
    </>
  );
}
