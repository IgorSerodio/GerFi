import React from "react";
import { Trash2, Tv, ExternalLink } from "lucide-react";
import { TvSettings } from "@/features/tv/types";
import { Location } from "@/features/management/types";;

interface TvConfigListProps {
  tvs: TvSettings[];
  locations: Location[];
  filterLocationId: number;
  handleEdit: (tv: TvSettings) => void;
  handleDelete: (id: number) => void;
}

export function TvConfigList({ tvs, locations, filterLocationId, handleEdit, handleDelete }: TvConfigListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tvs.filter((tv) => tv.locationId === filterLocationId).map((tv) => (
        <div key={tv.id} className="bg-white p-6 rounded-[30px] border border-emerald-100 shadow-sm relative group hover:border-sefaz-accent transition-colors flex flex-col h-full">
          <div className="w-12 h-12 bg-emerald-50 text-sefaz-accent rounded-xl flex items-center justify-center mb-4">
            <Tv size={24} />
          </div>
          <h4 className="text-lg font-black text-sefaz-dark uppercase truncate">{tv.name}</h4>
          <div className="text-xs font-medium text-sefaz-accent/70 mt-1 mb-4 flex items-center gap-1">
            <span>URL:</span>
            <a 
              href={tv.slug === 'global' ? '/tv' : `/tv/${tv.slug}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              /tv{tv.slug === 'global' ? '' : `/${tv.slug}`} <ExternalLink size={12} />
            </a>
          </div>

          <div className="flex-1 text-[10px] text-gray-500 mb-6 space-y-1">
            <p><strong>Local:</strong> {locations.find(l => l.id === tv.locationId)?.name || 'Principal'}</p>
            <p><strong>Modo:</strong> {tv.mode === 'live' ? 'YouTube' : 'Mídias'}</p>
            <p><strong>Serviços Exibidos:</strong> {tv.services.length === 0 ? 'Todos (Global)' : `${tv.services.length} serviços selecionados`}</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => handleEdit(tv)}
              className="flex-1 py-3 bg-emerald-50 text-sefaz-accent font-bold text-xs uppercase rounded-xl hover:bg-emerald-100 transition-colors"
            >
              Editar
            </button>
            {tv.id !== 1 && (
              <button 
                onClick={() => handleDelete(tv.id)}
                className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
