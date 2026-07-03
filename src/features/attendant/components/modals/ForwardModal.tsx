import React from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { X } from "lucide-react";
import { Ticket } from "@/features/queue/types";

interface ForwardModalProps {
  show: boolean;
  currentCall?: Ticket;
  attendants: string[];
  currentGuiche: string;
  onClose: () => void;
  onForward: (ticketId: string, guiche: string) => void;
}

export default function ForwardModal({
  show,
  currentCall,
  attendants,
  currentGuiche,
  onClose,
  onForward,
}: ForwardModalProps) {
  return (
    <Modal 
      isOpen={show && !!currentCall} 
      onClose={onClose}
      zIndex="z-[60]"
      className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden p-0"
    >
      {currentCall && (
        <>
          <div className="p-8 border-b border-emerald-50 flex justify-between items-center">
              <div>
                <h3 className={`text-2xl font-black uppercase tracking-tight ${currentCall.priority === "Prioritário" ? "text-red-600" : "text-sefaz-dark"}`}>
                  Encaminhar Senha: {currentCall.ticketNumber}
                </h3>
                <p className="text-sm font-medium text-sefaz-accent/60">
                  Selecione o guichê de destino
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-2 gap-4">
              {attendants
                .filter((g) => g !== currentGuiche)
                .map((guiche) => (
                  <button
                    key={guiche}
                    onClick={() => onForward(currentCall.id, guiche)}
                    className="p-6 bg-emerald-50/50 hover:bg-emerald-100/50 border-2 border-emerald-100 rounded-3xl text-left transition-all group cursor-pointer"
                  >
                    <p className="text-[10px] font-black text-sefaz-accent/40 uppercase tracking-widest mb-1">
                      Destino
                    </p>
                    <p className="text-lg font-black text-sefaz-dark group-hover:text-sefaz-accent transition-colors">
                      {guiche}
                    </p>
                  </button>
                ))}
            </div>
        </>
      )}
    </Modal>
  );
}
