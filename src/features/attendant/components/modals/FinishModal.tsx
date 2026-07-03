import React from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { X } from "lucide-react";
import { Ticket } from "@/features/queue/types";

interface FinishModalProps {
  show: boolean;
  ticketToFinish: string | null;
  history: Ticket[];
  currentCall?: Ticket;
  observation: string;
  setObservation: (obs: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function FinishModal({
  show,
  ticketToFinish,
  history,
  currentCall,
  observation,
  setObservation,
  onClose,
  onConfirm,
}: FinishModalProps) {
  const ticketToFinishObj = history.find((t) => t.id === ticketToFinish) || currentCall;
  const ticketVisualId = ticketToFinishObj?.ticketNumber;
  const isPriority = ticketToFinishObj?.priority === "Prioritário";

  return (
    <Modal 
      isOpen={show && !!ticketToFinish} 
      onClose={onClose}
      zIndex="z-[60]"
      className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden p-0"
    >
            <div className="p-8 border-b border-emerald-50 flex justify-between items-center">
              <div>
                <h3 className={`text-2xl font-black uppercase tracking-tight ${isPriority ? "text-red-600" : "text-sefaz-dark"}`}>
                  Finalizar Atendimento: {ticketVisualId}
                </h3>
                <p className="text-sm font-medium text-sefaz-accent/60">
                  Deseja adicionar alguma observação?
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
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest">
                    Observações (Opcional)
                  </label>
                  <span
                    className={`text-[10px] font-bold ${
                      observation.length > 280
                        ? "text-red-500"
                        : "text-sefaz-accent/40"
                    }`}
                  >
                    {observation.length}/300
                  </span>
                </div>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value.slice(0, 300))}
                  placeholder="Digite aqui detalhes sobre o atendimento..."
                  className="w-full h-32 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl p-4 text-sm font-medium outline-none focus:border-sefaz-accent transition-colors resize-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer"
                >
                  VOLTAR
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 py-4 bg-sefaz-accent text-white rounded-2xl font-bold hover:bg-sefaz-dark transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  FINALIZAR AGORA
                </button>
              </div>
            </div>
    </Modal>
  );
}
