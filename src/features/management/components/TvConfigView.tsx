import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trash2, Save, X } from "lucide-react";
import { TvSettings } from "@/features/queue/types";
import { getTvSettingsAction, updateTvSettingsAction } from "@/features/queue/actions";

interface TvConfigViewProps {
  initialTvSettings: TvSettings;
  triggerSuccess: (msg: string) => void;
}

export default function TvConfigView({ initialTvSettings, triggerSuccess }: TvConfigViewProps) {
  const [tvSettings, setTvSettings] = useState<TvSettings>(initialTvSettings);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  useEffect(() => {
    const loadTvSettings = async () => {
      const res = await getTvSettingsAction();
      if (res.success && res.data) {
        setTvSettings(res.data as TvSettings);
      }
    };
    loadTvSettings();
  }, []);

  const handleSaveTvSettings = async () => {
    const res = await updateTvSettingsAction(tvSettings);
    if (res.success) {
      triggerSuccess("Configurações da TV salvas!");
    } else {
      alert("Erro ao salvar configurações da TV");
    }
  };

  const handleAddVideo = async () => {
    if (!newVideoUrl) return;
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

      setTvSettings(prev => ({
        ...prev,
        videoUrl: [...(prev.videoUrl || []), { url: newVideoUrl, videoId, title }]
      }));
      setNewVideoUrl("");
      triggerSuccess("Vídeo adicionado à playlist!");
    } catch {
      alert("Erro ao adicionar vídeo.");
    } finally {
      setIsAddingVideo(false);
    }
  };

  const handleTvUpload = () => {
    // Simular upload de arquivo
    const simulatedFiles = [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
    ];
    setTvSettings((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...simulatedFiles],
    }));
    triggerSuccess("Simulado upload de mídias institucionais!");
  };

  return (
    <motion.div
      key="config_tv"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="max-w-xl mx-auto bg-white p-8 rounded-[40px] border border-emerald-100 shadow-sm space-y-8"
    >
      <h3 className="text-2xl font-black text-sefaz-dark uppercase tracking-tight">
        Configurações do Painel TV
      </h3>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
            Modo de Exibição
          </label>
          <div className="grid grid-cols-2 gap-2 bg-emerald-50/50 p-1.5 rounded-2xl">
            <button
              onClick={() => setTvSettings({ ...tvSettings, mode: "live" })}
              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                tvSettings.mode === "live"
                  ? "bg-sefaz-accent text-white shadow-md"
                  : "text-sefaz-accent opacity-60"
              }`}
            >
              Transmissão Ao Vivo
            </button>
            <button
              onClick={() => setTvSettings({ ...tvSettings, mode: "files" })}
              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                tvSettings.mode === "files"
                  ? "bg-sefaz-accent text-white shadow-md"
                  : "text-sefaz-accent opacity-60"
              }`}
            >
              Mídias da Cidade
            </button>
          </div>
        </div>

        {tvSettings.mode === "live" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                Adicionar Vídeo (YouTube)
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
            
            {tvSettings.videoUrl && tvSettings.videoUrl.length > 0 && (
              <div className="space-y-2 mt-4">
                <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                  Playlist
                </label>
                <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {tvSettings.videoUrl.map((video, idx) => (
                    <div key={idx} className="bg-emerald-50/30 rounded-2xl border border-emerald-100 p-3 flex gap-4 items-center relative group">
                      <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                        <img src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-sefaz-dark line-clamp-2">{video.title}</p>
                      </div>
                      <button
                        onClick={() => {
                          const newList = [...tvSettings.videoUrl];
                          newList.splice(idx, 1);
                          setTvSettings({...tvSettings, videoUrl: newList});
                        }}
                        className="w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center border border-red-100 shrink-0 transition-colors shadow-sm cursor-pointer"
                        title="Remover vídeo"
                      >
                        <Trash2 size={14} />
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
                <p className="text-xs font-black text-sefaz-dark uppercase">Slides de Mídia</p>
                <p className="text-[9px] text-sefaz-accent font-bold uppercase opacity-60">
                  Upload de mídias institucionais (.jpg, .png)
                </p>
              </div>
              <button
                onClick={handleTvUpload}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent border border-emerald-200 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
              >
                Carregar
              </button>
            </div>

            {tvSettings.uploadedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {tvSettings.uploadedFiles.map((file, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden border border-emerald-100 aspect-video bg-slate-50">
                    <img src={file} className="w-full h-full object-cover" alt="Slide" />
                    <button
                      onClick={() => {
                        const list = tvSettings.uploadedFiles.filter((_, idx) => idx !== i);
                        setTvSettings({ ...tvSettings, uploadedFiles: list });
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

        <button
          onClick={handleSaveTvSettings}
          className="w-full py-5 bg-sefaz-accent text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-sefaz-dark transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Save size={18} /> Salvar Parâmetros TV
        </button>
      </div>
    </motion.div>
  );
}
