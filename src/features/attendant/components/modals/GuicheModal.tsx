import React from "react";
import { motion } from "motion/react";
import { Modal } from "@/components/ui/Modal";
import { X } from "lucide-react";

interface GuicheModalProps {
  show: boolean;
  currentGuiche: string;
  onClose: () => void;
  onSelect: (guiche: string) => void;
}

export default function GuicheModal({
  show,
  currentGuiche,
  onClose,
  onSelect,
}: GuicheModalProps) {
  return (
    <Modal 
      isOpen={show} 
      onClose={onClose}
      zIndex="z-[70]"
      className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden p-0"
    >
            <div className="p-8 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/30">
              <div>
                <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
                  Alterar Guichê
                </h3>
                <p className="text-xs font-bold text-sefaz-accent/60 uppercase tracking-widest">
                  Selecione o seu local de atendimento
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-sefaz-accent/40 hover:text-sefaz-accent transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {Array.from({ length: 20 }, (_, i) => {
                  const guicheNum = (i + 1).toString().padStart(2, "0");
                  const guicheName = `Guichê ${guicheNum}`;
                  const isCurrent = currentGuiche === guicheName;

                  return (
                    <button
                      key={guicheNum}
                      onClick={() => onSelect(guicheName)}
                      className={`p-4 rounded-2xl font-black text-lg transition-all border-2 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isCurrent
                          ? "bg-sefaz-accent border-sefaz-accent text-white shadow-lg"
                          : "bg-emerald-50/50 border-emerald-50 text-sefaz-dark hover:border-emerald-200 hover:bg-emerald-100/50"
                      }`}
                    >
                      <span className="text-[10px] opacity-40 uppercase tracking-widest">
                        No
                      </span>
                      {guicheNum}
                    </button>
                  );
                })}
              </div>
            </div>
    </Modal>
  );
}
