import React from "react";
import { Modal } from "@/components/ui/Modal";
import { X, Save } from "lucide-react";
import { TvSettings } from "@/features/tv/types";
import { DbCategory } from "@/features/management/types";
import { TvServiceFilter } from "./TvServiceFilter";
import { TvMediaSettings } from "./TvMediaSettings";

interface TvFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTv: TvSettings | null;
  setEditingTv: React.Dispatch<React.SetStateAction<TvSettings | null>>;
  isCreating: boolean;
  categories: DbCategory[];
  newVideoUrl: string;
  setNewVideoUrl: (url: string) => void;
  isAddingVideo: boolean;
  handleAddVideo: () => void;
  handleTvUpload: () => void;
  toggleService: (catId: number) => void;
  handleSave: () => void;
}

export function TvFormModal({
  isOpen,
  onClose,
  editingTv,
  setEditingTv,
  isCreating,
  categories,
  newVideoUrl,
  setNewVideoUrl,
  isAddingVideo,
  handleAddVideo,
  handleTvUpload,
  toggleService,
  handleSave,
}: TvFormModalProps) {
  if (!editingTv) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl w-full p-0 overflow-hidden bg-white rounded-[40px] shadow-2xl border border-emerald-100"
    >
      <div className="flex flex-col h-[85vh]">
        <div className="p-8 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/30 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
              {isCreating ? "Nova TV" : `Editar TV: ${editingTv.name}`}
            </h3>
            <p className="text-xs font-bold text-sefaz-accent opacity-60">
              Configure a exibição e os serviços permitidos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-sefaz-accent hover:text-sefaz-dark transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          {/* Infos Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                Nome da TV
              </label>
              <input
                type="text"
                required
                value={editingTv.name}
                disabled={editingTv.id === 1}
                onChange={(e) => setEditingTv({ ...editingTv, name: e.target.value })}
                className={`w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none font-bold text-sm ${editingTv.id === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Ex: Triagem Secundária"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                Slug (URL de Acesso)
              </label>
              <div className="flex items-stretch">
                <span className="flex items-center justify-center px-4 bg-emerald-100 text-sefaz-accent rounded-l-2xl border border-emerald-100 font-medium text-xs border-r-0 shrink-0 whitespace-nowrap">/tv/</span>
                <input
                  type="text"
                  required={editingTv.id !== 1}
                  value={editingTv.id === 1 ? "" : editingTv.slug}
                  disabled={editingTv.id === 1}
                  onChange={(e) => setEditingTv({ ...editingTv, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className={`flex-1 p-4 bg-emerald-50/50 rounded-r-2xl border border-emerald-100 outline-none font-bold text-sm min-w-0 ${editingTv.id === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder={editingTv.id === 1 ? "" : "slug-da-tv"}
                />
              </div>
            </div>
          </div>


          {/* Filtro de Serviços */}
          <TvServiceFilter 
            tvId={editingTv.id} 
            selectedServices={editingTv.services} 
            categories={categories} 
            toggleService={toggleService} 
          />

          <hr className="border-emerald-50" />

          {/* Mídia */}
          <TvMediaSettings 
            editingTv={editingTv}
            setEditingTv={setEditingTv}
            newVideoUrl={newVideoUrl}
            setNewVideoUrl={setNewVideoUrl}
            isAddingVideo={isAddingVideo}
            handleAddVideo={handleAddVideo}
            handleTvUpload={handleTvUpload}
          />
        </div>

        <div className="p-8 border-t border-emerald-50 shrink-0 bg-white">
          <button
            onClick={handleSave}
            className="w-full py-5 bg-sefaz-accent text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-sefaz-dark transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save size={18} /> Salvar Configurações da TV
          </button>
        </div>
      </div>
    </Modal>
  );
}
