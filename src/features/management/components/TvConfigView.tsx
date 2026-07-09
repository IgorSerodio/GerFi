import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Save, X, Plus, Tv, ExternalLink } from "lucide-react";
import { DbCategory } from "@/features/queue/types";
import { TvSettings } from "@/features/tv/types";
import { 
  getAllTvSettingsAction, 
  updateTvSettingsAction, 
  createTvSettingsAction,
  deleteTvSettingsAction
} from "@/features/tv/actions";
import { getCategoriesAction, getLocationsAction } from "@/features/queue/actions";
import { Modal } from "@/components/ui/Modal";
import LocationSelector from "@/components/ui/LocationSelector";
import { Location } from "@/features/queue/types";

interface TvConfigViewProps {
  triggerSuccess: (msg: string) => void;
}

export default function TvConfigView({ triggerSuccess }: TvConfigViewProps) {
  const [tvs, setTvs] = useState<TvSettings[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filterLocationId, setFilterLocationId] = useState<number>(0);
  
  const [editingTv, setEditingTv] = useState<TvSettings | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  const loadData = async () => {
    const [tvsRes, catRes, locRes] = await Promise.all([
      getAllTvSettingsAction(),
      getCategoriesAction(),
      getLocationsAction()
    ]);
    if (tvsRes.success && tvsRes.data) {
      setTvs(tvsRes.data as TvSettings[]);
    }
    if (catRes.success && catRes.data) {
      setCategories(catRes.data as DbCategory[]);
    }
    if (locRes.success && locRes.data) {
      const locs = locRes.data as Location[];
      setLocations(locs);
      setFilterLocationId(prev => locs.some(l => l.id === prev) ? prev : (locs[0]?.id ?? 0));
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleCreateNew = () => {
    const globalTv = tvs.find(t => t.id === 1);
    setEditingTv({
      id: 0,
      slug: "",
      name: "",
      mode: globalTv?.mode || "live",
      videoUrl: globalTv?.videoUrl ? [...globalTv.videoUrl] : [],
      uploadedFiles: globalTv?.uploadedFiles ? [...globalTv.uploadedFiles] : [],
      services: [],
      locationId: filterLocationId
    });
    setIsCreating(true);
  };

  const handleEdit = (tv: TvSettings) => {
    setEditingTv({ ...tv });
    setIsCreating(false);
  };

  const handleDelete = async (id: number) => {
    if (id === 1) return;
    if (confirm("Tem certeza que deseja excluir esta TV?")) {
      const res = await deleteTvSettingsAction(id);
      if (res.success) {
        triggerSuccess("TV excluída com sucesso.");
        loadData();
      } else {
        alert("Erro ao excluir TV.");
      }
    }
  };

  const handleSave = async () => {
    if (!editingTv) return;
    if (!editingTv.name || !editingTv.slug) {
      alert("Preencha o nome e o slug (URL) da TV.");
      return;
    }

    // Validação de slug (apenas letras minúsculas, números e hífens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(editingTv.slug)) {
      alert("O slug deve conter apenas letras minúsculas, números e hífens.");
      return;
    }

    if (isCreating) {
      const res = await createTvSettingsAction({
        slug: editingTv.slug,
        name: editingTv.name,
        mode: editingTv.mode,
        videoUrl: editingTv.videoUrl,
        uploadedFiles: editingTv.uploadedFiles,
        services: editingTv.services,
        locationId: editingTv.locationId || 0
      });
      if (res.success) {
        triggerSuccess("TV criada com sucesso!");
        setEditingTv(null);
        loadData();
      } else {
        alert("Erro ao criar TV: " + res.error);
      }
    } else {
      const res = await updateTvSettingsAction({
        id: editingTv.id,
        slug: editingTv.slug,
        name: editingTv.name,
        mode: editingTv.mode,
        videoUrl: editingTv.videoUrl,
        uploadedFiles: editingTv.uploadedFiles,
        services: editingTv.services,
        locationId: editingTv.locationId || 0
      });
      if (res.success) {
        triggerSuccess("Configurações da TV salvas!");
        setEditingTv(null);
        loadData();
      } else {
        alert("Erro ao salvar configurações da TV: " + res.error);
      }
    }
  };

  const handleAddVideo = async () => {
    if (!newVideoUrl || !editingTv) return;
    setIsAddingVideo(true);
    
    try {
      const videoIdMatch = newVideoUrl.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      if (!videoId) {
        alert("URL do YouTube inválida.");
        setIsAddingVideo(false);
        return;
      }

      let title = "Vídeo do YouTube";
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (res.ok) {
          const data = await res.json();
          if (data.title) title = data.title;
        }
      } catch (e) {
        console.error("Erro ao buscar título do vídeo", e);
      }

      setEditingTv(prev => prev ? ({
        ...prev,
        videoUrl: [...(prev.videoUrl || []), { url: newVideoUrl, videoId, title }]
      }) : prev);
      setNewVideoUrl("");
      triggerSuccess("Vídeo adicionado à playlist!");
    } catch {
      alert("Erro ao adicionar vídeo.");
    } finally {
      setIsAddingVideo(false);
    }
  };

  const handleTvUpload = () => {
    if (!editingTv) return;
    // Simular upload de arquivo
    const simulatedFiles = [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
    ];
    setEditingTv((prev) => prev ? ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...simulatedFiles],
    }) : prev);
    triggerSuccess("Simulado upload de mídias institucionais!");
  };

  const toggleService = (catId: number) => {
    if (!editingTv) return;
    setEditingTv(prev => {
      if (!prev) return prev;
      const has = prev.services.includes(catId);
      if (has) {
        return { ...prev, services: prev.services.filter(id => id !== catId) };
      } else {
        return { ...prev, services: [...prev.services, catId] };
      }
    });
  };

  return (
    <motion.div
      key="config_tv"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm">
        <div>
          <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
            Gestão de Painéis de TV
          </h3>
          <p className="text-xs font-bold text-sefaz-accent opacity-60">
            Gerencie múltiplas TVs departamentais e suas configurações.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LocationSelector
            locations={locations}
            value={filterLocationId}
            onChange={setFilterLocationId}
            heightClass="h-12"
            textSizeClass="text-xs"
            className="rounded-2xl"
          />
          <button
            onClick={handleCreateNew}
            className="px-6 py-4 bg-sefaz-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all cursor-pointer shadow-lg flex items-center gap-2"
          >
            <Plus size={16} /> Nova TV
          </button>
        </div>
      </div>

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

      <Modal
        isOpen={!!editingTv}
        onClose={() => setEditingTv(null)}
        className="max-w-2xl w-full p-0 overflow-hidden bg-white rounded-[40px] shadow-2xl border border-emerald-100"
      >
        {editingTv && (
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
                onClick={() => setEditingTv(null)}
                className="p-2 text-sefaz-accent hover:text-sefaz-dark transition-colors"
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
                        className={`p-3 text-left border rounded-xl flex items-center justify-between transition-colors ${
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
                                <img src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-sefaz-dark truncate">{video.title}</p>
                              </div>
                              <button
                                onClick={() => {
                                  const newList = [...editingTv.videoUrl];
                                  newList.splice(idx, 1);
                                  setEditingTv({...editingTv, videoUrl: newList});
                                }}
                                className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
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
                            <img src={file} className="w-full h-full object-cover" alt="Slide" />
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
        )}
      </Modal>
    </motion.div>
  );
}
