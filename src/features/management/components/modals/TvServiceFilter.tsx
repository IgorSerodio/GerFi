import React from "react";
import { DbCategory } from "@/features/management/types";

interface TvServiceFilterProps {
  tvId: number;
  selectedServices: number[];
  categories: DbCategory[];
  toggleService: (catId: number) => void;
}

export function TvServiceFilter({ tvId, selectedServices, categories, toggleService }: TvServiceFilterProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-black text-sefaz-dark uppercase">Serviços Exibidos</h4>
        <p className="text-[10px] text-gray-500">
          {tvId === 1 
            ? "A TV Principal exibe todos os serviços por padrão e não pode ter filtros específicos."
            : "Selecione quais serviços esta TV irá chamar. Se nenhum for selecionado, todos serão exibidos."}
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map(cat => {
          const isSelected = selectedServices.includes(cat.id);
          const isDisabled = tvId === 1;
          return (
            <button
              key={cat.id}
              type="button"
              disabled={isDisabled}
              onClick={() => toggleService(cat.id)}
              className={`p-3 text-left border rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                isSelected ? 'bg-sefaz-accent border-sefaz-accent text-white' : 'bg-white border-emerald-100 text-sefaz-dark hover:border-sefaz-accent hover:bg-emerald-50'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-emerald-100' : ''}`}
            >
              <span className="text-xs font-bold truncate pr-2">{cat.name}</span>
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-sefaz-dark/20' : 'border-emerald-200'}`}>
                {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
