import React from "react";

import { Modal } from "@/components/ui/Modal";
import { Users, Accessibility } from "lucide-react";
import { Category } from "../types";

interface PriorityModalProps {
  selectedCategory: Category | null;
  onClose: () => void;
  onIssue: (priority: "Normal" | "Prioritário") => void;
}

export default function PriorityModal({
  selectedCategory,
  onClose,
  onIssue,
}: PriorityModalProps) {
  return (
    <Modal 
      isOpen={!!selectedCategory} 
      onClose={onClose}
      zIndex="z-[60]"
      className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl border border-emerald-100"
    >
      {selectedCategory && (
        <>
          <div className="text-center mb-6">
              <div
                className={`w-12 h-12 ${selectedCategory.color} text-white rounded-xl flex items-center justify-center mx-auto mb-3`}
              >
                <selectedCategory.icon size={24} />
              </div>
              <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight">
                {selectedCategory.name}
              </h3>
              <p className="text-xs text-sefaz-accent font-bold opacity-60">
                Selecione a prioridade do atendimento
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => onIssue("Normal")}
                className="group relative flex items-center p-6 bg-emerald-50 rounded-2xl border-2 border-transparent hover:border-emerald-500 hover:bg-emerald-100/50 transition-all text-left cursor-pointer"
              >
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <div>
                  <span className="block text-sm font-black text-sefaz-dark leading-none">
                    NORMAL
                  </span>
                  <span className="text-[10px] text-sefaz-accent font-bold opacity-60">
                    Atendimento Regular
                  </span>
                </div>
              </button>

              <button
                onClick={() => onIssue("Prioritário")}
                className="group relative flex items-center p-6 bg-amber-50 rounded-2xl border-2 border-transparent hover:border-amber-500 hover:bg-amber-100/50 transition-all text-left cursor-pointer"
              >
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Accessibility size={20} />
                </div>
                <div>
                  <span className="block text-sm font-black text-sefaz-dark leading-none">
                    PRIORITÁRIO
                  </span>
                  <span className="text-[10px] text-sefaz-accent font-bold opacity-60">
                    Idosos, PCD, Gestantes
                  </span>
                </div>
              </button>

              <button
                onClick={onClose}
                className="mt-2 py-3 text-sefaz-accent font-bold text-xs uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
              >
                Cancelar
              </button>
            </div>
        </>
      )}
    </Modal>
  );
}
