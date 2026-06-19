import React from "react";
import { motion, AnimatePresence } from "motion/react";
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
    <AnimatePresence>
      {show && currentCall && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-sefaz-dark/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden"
          >
            <div className="p-8 border-b border-emerald-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
