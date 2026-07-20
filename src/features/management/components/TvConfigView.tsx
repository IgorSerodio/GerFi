import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { DbCategory } from "@/features/management/types";;
import { TvSettings } from "@/features/tv/types";
import { 
  getAllTvSettingsAction, 
  updateTvSettingsAction, 
  createTvSettingsAction,
  deleteTvSettingsAction
} from "@/features/tv/actions";
import { getCategoriesAction, getLocationsAction } from "@/features/management/actions";;

import LocationSelector from "@/components/ui/LocationSelector";
import { Location } from "@/features/management/types";;
import { TvConfigList } from "./TvConfigList";
import { TvFormModal } from "./modals/TvFormModal";

interface TvConfigViewProps {
  triggerSuccess: (msg: string) => void;
}

export default function TvConfigView({ triggerSuccess }: TvConfigViewProps) {
  const [tvs, setTvs] = useState<TvSettings[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filterLocationId, setFilterLocationId] = useState<number>(1);
  
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
      setFilterLocationId(prev => locs.some(l => l.id === prev) ? prev : (locs[0]?.id ?? 1));
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
        locationId: editingTv.locationId || 1
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
        locationId: editingTv.locationId || 1
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

      <TvConfigList 
        tvs={tvs}
        locations={locations}
        filterLocationId={filterLocationId}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />

      <TvFormModal
        isOpen={!!editingTv}
        onClose={() => setEditingTv(null)}
        editingTv={editingTv}
        setEditingTv={setEditingTv as unknown as React.Dispatch<React.SetStateAction<TvSettings | null>>}
        isCreating={isCreating}
        categories={categories}
        newVideoUrl={newVideoUrl}
        setNewVideoUrl={setNewVideoUrl}
        isAddingVideo={isAddingVideo}
        handleAddVideo={handleAddVideo}
        handleTvUpload={handleTvUpload}
        toggleService={toggleService}
        handleSave={handleSave}
      />
    </motion.div>
  );
}
