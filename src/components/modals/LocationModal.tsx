import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Location } from "@/features/management/types";;
import { MapPin } from "lucide-react";

interface LocationModalProps {
  show: boolean;
  locations: Location[];
  onSelect: (locationId: number) => void;
}

export default function LocationModal({ show, locations, onSelect }: LocationModalProps) {
  return (
    <Modal isOpen={show} onClose={() => {}} className="max-w-md w-full p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
          <MapPin size={32} />
        </div>
        <h3 className="text-2xl font-black text-sefaz-dark tracking-tight uppercase">
          Selecione o Local
        </h3>
        <p className="text-sm font-bold text-sefaz-accent opacity-60 uppercase mt-2">
          Onde você está operando?
        </p>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
        {locations.filter(l => l.isActive).map((loc) => (
          <button
            key={loc.id}
            onClick={() => onSelect(loc.id)}
            className="w-full p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 text-left transition-colors flex items-center justify-between"
          >
            <span className="font-black text-sefaz-dark">{loc.name} {loc.id === 0 && <span className="text-amber-500 text-xs ml-1">(Principal)</span>}</span>
          </button>
        ))}
        {locations.filter(l => l.isActive).length === 0 && (
          <p className="text-center text-sm font-bold text-sefaz-accent opacity-50 py-4">Nenhum local ativo encontrado.</p>
        )}
      </div>
    </Modal>
  );
}
