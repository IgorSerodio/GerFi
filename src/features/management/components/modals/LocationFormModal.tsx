import React from "react";
import { Modal } from "@/components/ui/Modal";

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  locationName: string;
  onLocationNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LocationFormModal({
  isOpen,
  onClose,
  isEditing,
  locationName,
  onLocationNameChange,
  onSubmit,
}: LocationFormModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-w-md w-full p-8"
    >
      <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
        {isEditing ? "Editar Local" : "Novo Local"}
      </h3>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
            Apelido do Local
          </label>
          <input
            type="text"
            required
            value={locationName}
            onChange={(e) => onLocationNameChange(e.target.value)}
            className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-sm font-bold"
            placeholder="Ex: Anexo 1"
          />
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
