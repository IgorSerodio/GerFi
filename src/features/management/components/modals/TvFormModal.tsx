import React from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Trash2, X, Save } from "lucide-react";
import { TvSettings } from "@/features/tv/types";
import { DbCategory } from "@/features/management/types";

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
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-black text-sefaz-dark uppercase">Serviços Exibidos</h4>
              <p className="text-[10px] text-gray-500">
                {editingTv.id === 1 
                  ? "A TV Principal exibe todos os serviços por padrão e não pode ter filtros específicos."
                  : "Selecione quais serviços esta TV irá chamar. Se nenhum for selecionado, todos serão exibidos."}
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(cat => {
                const isSelected = editingTv.services.includes(cat.id);
                const isDisabled = editingTv.id === 1;
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

          <hr className="border-emerald-50" />

          {/* Mídia */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                Modo de Exibição
              </label>
              <div className="grid grid-cols-2 gap-2 bg-emerald-50/50 p-1.5 rounded-2xl">
                <button
                  onClick={() => setEditingTv({ ...editingTv, mode: "live" })}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                    editingTv.mode === "live"
                      ? "bg-sefaz-accent text-white shadow-md"
                      : "text-sefaz-accent opacity-60"
                  }`}
                >
                  Transmissão Ao Vivo (YouTube)
                </button>
                <button
                  onClick={() => setEditingTv({ ...editingTv, mode: "files" })}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                    editingTv.mode === "files"
                      ? "bg-sefaz-accent text-white shadow-md"
                      : "text-sefaz-accent opacity-60"
                  }`}
                >
                  Slides da Cidade
                </button>
              </div>
            </div>

            {editingTv.mode === "live" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                    Adicionar Vídeo à Playlist
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="Ex: https://www.youtube.com/watch?v=..."
                      className="flex-1 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-medium text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddVideo();
                      }}
                    />
                    <button
                      onClick={handleAddVideo}
                      disabled={isAddingVideo || !newVideoUrl}
                      className="px-6 py-4 bg-sefaz-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isAddingVideo ? "..." : "Adicionar"}
                    </button>
                  </div>
                </div>
                
                {editingTv.videoUrl && editingTv.videoUrl.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                      Playlist Atual
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {editingTv.videoUrl.map((video, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-emerald-100 p-3 flex gap-4 items-center">
                          <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                            <Image src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} fill={true} style={{ objectFit: 'cover' }} alt={video.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-sefaz-dark truncate">{video.title}</p>
                          </div>
                          <button
                            onClick={() => {
                              const newList = [...(editingTv.videoUrl || [])];
                              newList.splice(idx, 1);
                              setEditingTv({...editingTv, videoUrl: newList});
                            }}
                            className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 border border-emerald-50 p-6 rounded-3xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black text-sefaz-dark uppercase">Slides Atuais</p>
                    <p className="text-[9px] text-sefaz-accent font-bold uppercase opacity-60">Upload automático em testes</p>
                  </div>
                  <button
                    onClick={handleTvUpload}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    Carregar Mídias Simuladas
                  </button>
                </div>

                {editingTv.uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {editingTv.uploadedFiles.map((file, i) => (
                      <div key={i} className="relative rounded-lg overflow-hidden border border-emerald-100 aspect-video bg-slate-50">
                        <Image src={file} fill={true} style={{ objectFit: 'cover' }} className="w-full h-full object-cover" alt="Slide" />
                        <button
                          onClick={() => {
                            const list = editingTv.uploadedFiles.filter((_, idx) => idx !== i);
                            setEditingTv({ ...editingTv, uploadedFiles: list });
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
