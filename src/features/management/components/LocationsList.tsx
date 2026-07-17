import React from "react";
import { MapPin, Ban, CheckCircle, Pen, Trash2 } from "lucide-react";
import { Location } from "@/features/queue/types";

interface LocationsListProps {
  locations: Location[];
  selectedLocationId: number | null;
  onSelectLocation: (id: number) => void;
  onToggleActive: (loc: Location) => void;
  onEditLocation: (loc: Location) => void;
  onDeleteLocation: (id: number) => void;
  onNewLocation: () => void;
}

export function LocationsList({
  locations,
  selectedLocationId,
  onSelectLocation,
  onToggleActive,
  onEditLocation,
  onDeleteLocation,
  onNewLocation,
}: LocationsListProps) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm flex flex-col h-[600px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
          Locais
        </h3>
        <button
          onClick={onNewLocation}
          className="px-4 py-2 bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition-all cursor-pointer"
        >
          + Novo Local
        </button>
      </div>
      <div className="overflow-y-auto custom-scrollbar flex-1 border border-emerald-50 rounded-2xl p-2 bg-emerald-50/20">
        <div className="space-y-2">
          {locations.map((loc) => {
            const isSelected = selectedLocationId === loc.id;
            const isPrincipal = loc.id === 0;

            return (
              <div 
                key={loc.id} 
                onClick={() => onSelectLocation(loc.id)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? "bg-amber-50 border-amber-200" : "bg-white border-emerald-100 hover:bg-emerald-50"
                } ${!loc.isActive ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-sefaz-dark">
                      {loc.name} {isPrincipal && <span className="text-amber-500 ml-1">(Principal)</span>}
                    </p>
                    <p className="text-[10px] font-bold text-sefaz-accent uppercase">
                      {loc.isActive ? "Ativo" : "Bloqueado"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {!isPrincipal && (
                    <button onClick={() => onToggleActive(loc)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer" title={loc.isActive ? "Bloquear Local" : "Ativar Local"}>
                      {loc.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                  )}
                  <button 
                    onClick={() => onEditLocation(loc)} 
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"
                    title="Editar"
                  >
                    <Pen size={16} />
                  </button>
                  {!isPrincipal && (
                    <button onClick={() => onDeleteLocation(loc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
