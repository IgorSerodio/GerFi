import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Play } from "lucide-react";
import { Ticket } from "@/features/queue/types";;;

interface StartModalProps {
  show: boolean;
  currentCall: Ticket | undefined;
  onClose: () => void;
  onConfirm: (code: string) => Promise<void>;
}

export default function StartModal({
  show,
  currentCall,
  onClose,
  onConfirm,
}: StartModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!currentCall) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onConfirm(code);
    setLoading(false);
    setCode("");
  };

  return (
    <Modal isOpen={show} onClose={onClose}>
      <h2 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight mb-2">
        INICIALIZAR ATENDIMENTO
      </h2>
      <p className="text-sm font-medium text-gray-500 mb-6">
        Solicite ao cidadão o código de inicialização de 4 letras impresso na senha.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-black text-sefaz-dark uppercase tracking-widest mb-2">
            Código de Inicialização
          </label>
          <input
            type="text"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full text-center text-4xl tracking-[0.3em] font-black p-4 border-2 border-emerald-100 rounded-2xl focus:border-sefaz-accent focus:outline-none transition-colors"
            placeholder="XXXX"
            required
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-sefaz-dark font-bold hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || code.length !== 4}
            className="px-6 py-3 bg-sefaz-accent text-white rounded-xl font-black tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <Play size={18} />
            {loading ? "Iniciando..." : "INICIAR"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
