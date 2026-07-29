import React from "react";
import { Modal } from "@/components/ui/Modal";

interface TicketWindowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketWindowAlias: string;
  onTicketWindowAliasChange: (alias: string) => void;
  ticketWindowLabel: string;
  onTicketWindowLabelChange: (label: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  originalName: string;
}

export function TicketWindowFormModal({
  isOpen,
  onClose,
  ticketWindowAlias,
  onTicketWindowAliasChange,
  ticketWindowLabel,
  onTicketWindowLabelChange,
  onSubmit,
  originalName,
}: TicketWindowFormModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-w-md w-full p-8"
    >
      <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
        Editar Guichê
      </h3>
      <p className="text-sm text-emerald-800 mb-6 font-semibold">Você está editando: {originalName}</p>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Sufixo (Prefixo do Painel) Opcional
            </label>
            <input
              type="text"
              value={ticketWindowLabel}
              onChange={(e) => onTicketWindowLabelChange(e.target.value)}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-sm font-bold"
              placeholder="Ex: MESA, SALA"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Apelido Opcional
            </label>
            <input
              type="text"
              value={ticketWindowAlias}
              onChange={(e) => onTicketWindowAliasChange(e.target.value)}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-sm font-bold"
              placeholder="Ex: Mesa 1, Sala Médica"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-emerald-50 text-sefaz-accent rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 text-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-xl text-xs cursor-pointer"
          >
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
