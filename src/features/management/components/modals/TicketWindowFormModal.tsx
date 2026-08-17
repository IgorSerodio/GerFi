import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { DbTicketWindow } from "@/features/management/types";

interface TicketWindowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTw: DbTicketWindow | null;
  availableGroups: string[];
  onSubmit: (data: { alias: string | null; label: string | null; groupName: string | null }) => Promise<void> | void;
}

export function TicketWindowFormModal({
  isOpen,
  onClose,
  editingTw,
  availableGroups,
  onSubmit,
}: TicketWindowFormModalProps) {
  const [label, setLabel] = useState("");
  const [alias, setAlias] = useState("");
  const [selectedGroupOption, setSelectedGroupOption] = useState("");
  const [customGroupName, setCustomGroupName] = useState("");

  useEffect(() => {
    if (editingTw && isOpen) {
      setLabel(editingTw.label || "");
      setAlias(editingTw.alias || "");
      setSelectedGroupOption(editingTw.groupName || "");
      setCustomGroupName("");
    }
  }, [editingTw, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalGroup: string | null = null;
    if (selectedGroupOption === "__NEW__") {
      finalGroup = customGroupName.trim() || null;
    } else if (selectedGroupOption) {
      finalGroup = selectedGroupOption;
    }

    onSubmit({
      label: label.trim() || null,
      alias: alias.trim() || null,
      groupName: finalGroup,
    });
  };

  const isCreatingNewGroup = selectedGroupOption === "__NEW__";

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-w-md w-full p-8"
    >
      <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-6">
        Editar Guichê
      </h3>
      <p className="text-sm text-emerald-800 mb-6 font-semibold">
        Você está editando: {editingTw?.name || ""}
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Sufixo (Prefixo do Painel) Opcional
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-sm font-bold"
              placeholder="Ex: Box, Local"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Apelido Opcional
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-sm font-bold"
              placeholder="Ex: Sala Médica"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Grupo de Encaminhamento
            </label>
            <select
              value={selectedGroupOption}
              onChange={(e) => setSelectedGroupOption(e.target.value)}
              className="w-full p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 outline-none text-sm font-bold"
            >
              <option value="">Sem grupo</option>
              {availableGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
              <option value="__NEW__">+ Novo Grupo</option>
            </select>
            {isCreatingNewGroup && (
              <input
                type="text"
                autoFocus
                value={customGroupName}
                onChange={(e) => setCustomGroupName(e.target.value)}
                className="w-full p-3 mt-2 bg-emerald-50/50 rounded-xl border border-emerald-500 outline-none text-sm font-bold shadow-inner"
                placeholder="Digite o nome do novo grupo"
              />
            )}
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
