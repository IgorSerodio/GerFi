import React from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { X } from "lucide-react";
import { Ticket } from "@/features/queue/types";

interface HistoryDetailModalProps {
  selectedHistoryTicket: Ticket | null;
  onClose: () => void;
}

export default function HistoryDetailModal({
  selectedHistoryTicket,
  onClose,
}: HistoryDetailModalProps) {
  return (
    <Modal 
      isOpen={!!selectedHistoryTicket} 
      onClose={onClose}
      zIndex="z-[60]"
      className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden p-0"
    >
      {selectedHistoryTicket && (
        <>
          <div className="p-8 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/30">
              <div>
                <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                  CUPOM: {selectedHistoryTicket.ticketNumber}
                </h3>
                <p className="text-xs font-bold text-sefaz-accent/60 uppercase tracking-widest">
                  Detalhes do Atendimento
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                    Chamado às
                  </p>
                  <p className="text-lg font-black text-sefaz-dark">
                    {selectedHistoryTicket.calledAt
                      ? new Date(selectedHistoryTicket.calledAt).toLocaleTimeString()
                      : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                    Atendente
                  </p>
                  <p className="text-lg font-black text-sefaz-dark">
                    {selectedHistoryTicket.attendant}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                    Guichê
                  </p>
                  <p className="text-lg font-black text-sefaz-dark">
                    {selectedHistoryTicket.guiche}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                    Status
                  </p>
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase">
                    Finalizado
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                  Observações Registradas
                </p>
                <p className="text-sm font-medium text-sefaz-dark leading-relaxed italic">
                  {selectedHistoryTicket.observation ||
                    "Nenhuma observação registrada para este atendimento."}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-sefaz-accent text-white rounded-2xl font-bold hover:bg-sefaz-dark transition-all cursor-pointer"
              >
                FECHAR DETALHES
              </button>
            </div>
        </>
      )}
    </Modal>
  );
}
