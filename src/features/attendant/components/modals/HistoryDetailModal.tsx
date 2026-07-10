import React from "react";
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
  
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Finalizado", classes: "bg-emerald-100 text-emerald-700" };
      case "no_show":
        return { label: "Não Compareceu", classes: "bg-red-100 text-red-700" };
      case "forwarded":
        return { label: "Encaminhado", classes: "bg-blue-100 text-blue-700" };
      case "started":
        return { label: "Em Atendimento", classes: "bg-amber-100 text-amber-700" };
      case "calling":
        return { label: "Chamando", classes: "bg-yellow-100 text-yellow-700" };
      default:
        return { label: status, classes: "bg-gray-100 text-gray-700" };
    }
  };

  const statusInfo = selectedHistoryTicket ? getStatusDisplay(selectedHistoryTicket.status) : null;

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
                <h3 className={`text-2xl font-black uppercase tracking-tight ${selectedHistoryTicket.priority === "Prioritário" ? "text-red-600" : "text-sefaz-dark"}`}>
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
                    Status
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase ${statusInfo?.classes}`}>
                    {statusInfo?.label}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                    Atendente / Guichê
                  </p>
                  <p className="text-lg font-black text-sefaz-dark leading-tight">
                    {selectedHistoryTicket.attendant}<br/>
                    <span className="text-sm font-bold text-sefaz-accent/70">{selectedHistoryTicket.guiche}</span>
                  </p>
                </div>
                
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
                    Iniciado às
                  </p>
                  <p className="text-lg font-black text-sefaz-dark">
                    {selectedHistoryTicket.startedAt
                      ? new Date(selectedHistoryTicket.startedAt).toLocaleTimeString()
                      : "-"}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                    Finalizado às
                  </p>
                  <p className="text-lg font-black text-sefaz-dark">
                    {selectedHistoryTicket.completedAt
                      ? new Date(selectedHistoryTicket.completedAt).toLocaleTimeString()
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100">
                <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                  Histórico de Rechamadas
                </p>
                {selectedHistoryTicket.recallHistory && selectedHistoryTicket.recallHistory.length > 0 ? (
                  <ul className="list-disc list-inside text-sm font-medium text-sefaz-dark">
                    {selectedHistoryTicket.recallHistory.map((recallTime, idx) => (
                      <li key={idx}>Rechamado às {new Date(recallTime).toLocaleTimeString()}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-medium text-sefaz-dark/60 italic">
                    Sem rechamadas
                  </p>
                )}
              </div>

              <div className="space-y-2 p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100">
                <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest">
                  Motivos do Atendimento
                </p>
                {selectedHistoryTicket.resolutions && selectedHistoryTicket.resolutions.length > 0 ? (
                  <ul className="list-disc list-inside text-sm font-medium text-sefaz-dark">
                    {selectedHistoryTicket.resolutions.map((res, idx) => (
                      <li key={idx}>{res}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-medium text-sefaz-dark/60 italic">
                    Nenhum motivo selecionado
                  </p>
                )}
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

