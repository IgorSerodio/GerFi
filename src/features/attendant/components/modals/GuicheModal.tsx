import React from "react";

import { Modal } from "@/components/ui/Modal";
import { X } from "lucide-react";

interface GuicheModalProps {
  show: boolean;
  currentGuiche: string;
  ticketWindows: string[];
  activeGuiches: { guiche: string; attendantName: string }[];
  onClose: () => void;
  onSelect: (guiche: string) => void;
  onVacate: () => void;
}

export default function GuicheModal({
  show,
  currentGuiche,
  ticketWindows,
  activeGuiches,
  onClose,
  onSelect,
  onVacate,
}: GuicheModalProps) {

  const handleSelect = (guicheName: string) => {
    const occupant = activeGuiches.find((a) => a.guiche === guicheName);
    if (occupant && occupant.guiche !== currentGuiche) {
      const confirm = window.confirm(`O ${guicheName} está sendo usado por ${occupant.attendantName}. Deseja assumir este guichê e desconectar o outro usuário?`);
      if (!confirm) return;
    }
    onSelect(guicheName);
  };

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
                  Selecione o Guichê
                </h3>
                <p className="text-xs font-bold text-sefaz-accent/60 uppercase tracking-widest">
                  Escolha o seu local de atendimento
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {ticketWindows.map((guicheName) => {
                  const isCurrent = currentGuiche === guicheName;
                  const occupant = activeGuiches.find((a) => a.guiche === guicheName);
                  const isOccupiedByOther = occupant && !isCurrent;

                  return (
                    <button
                      key={guicheName}
                      onClick={() => handleSelect(guicheName)}
                      className={`p-4 rounded-2xl transition-all border-2 flex flex-col items-start justify-center gap-1 cursor-pointer ${
                        isCurrent
                          ? "bg-sefaz-accent border-sefaz-accent text-white shadow-lg"
                          : isOccupiedByOther
                          ? "bg-red-50/50 border-red-100 text-sefaz-dark hover:border-red-300 hover:bg-red-100/50"
                          : "bg-emerald-50/50 border-emerald-50 text-sefaz-dark hover:border-emerald-200 hover:bg-emerald-100/50"
                      }`}
                    >
                      <span className="font-black text-lg">
                        {guicheName}
                      </span>
                      <span className={`text-[10px] uppercase tracking-widest font-bold truncate w-full text-left ${isCurrent ? 'text-white/80' : isOccupiedByOther ? 'text-red-500' : 'text-sefaz-accent/50'}`}>
                        {isCurrent ? "Seu Guichê" : occupant ? `Ocupado: ${occupant.attendantName}` : "Livre"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {currentGuiche && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
                  <button
                    onClick={onVacate}
                    className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold rounded-2xl transition-colors border border-red-200"
                  >
                    Desocupar Meu Guichê Atual
                  </button>
                </div>
              )}
            </div>
    </Modal>
  );
}
