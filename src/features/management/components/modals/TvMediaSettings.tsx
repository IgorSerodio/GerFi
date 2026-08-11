import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Trash2, X, PlayCircle, ListVideo, Presentation } from "lucide-react";
import { TvSettings } from "@/features/tv/types";
import { resolveYoutubeChannelAction } from "@/features/tv/services/youtube";

interface TvMediaSettingsProps {
  editingTv: TvSettings;
  setEditingTv: React.Dispatch<React.SetStateAction<TvSettings | null>>;
  newVideoUrl: string;
  setNewVideoUrl: (url: string) => void;
  isAddingVideo: boolean;
  handleAddVideo: () => void;
  handleTvUpload: () => void;
}

export function TvMediaSettings({
  editingTv,
  setEditingTv,
  newVideoUrl,
  setNewVideoUrl,
  isAddingVideo,
  handleAddVideo,
  handleTvUpload,
}: TvMediaSettingsProps) {
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [newMarquee, setNewMarquee] = useState("");
  const [newSlideTitle, setNewSlideTitle] = useState("");
  const [newSlideText, setNewSlideText] = useState("");
  const [channelMeta, setChannelMeta] = useState<{title?: string, avatarUrl?: string} | null>(null);

  useEffect(() => {
    if (editingTv.mode === "channel" && editingTv.youtubeChannel) {
      resolveYoutubeChannelAction(editingTv.youtubeChannel).then((res) => {
        if (res.success && res.data) {
          setChannelMeta({ title: res.data.title, avatarUrl: res.data.avatarUrl });
        } else {
          setChannelMeta(null);
        }
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChannelMeta(null);
    }
  }, [editingTv.mode, editingTv.youtubeChannel]);

  const handleSetChannel = () => {
    if (!newChannelUrl.trim()) return;
    setEditingTv({ ...editingTv, youtubeChannel: newChannelUrl.trim() });
    setNewChannelUrl("");
  };

  const handleAddMarquee = () => {
    if (!newMarquee.trim()) return;
    setEditingTv({
      ...editingTv,
      marqueeMessages: [...(editingTv.marqueeMessages || []), newMarquee.trim()]
    });
    setNewMarquee("");
  };

  const handleAddSlide = () => {
    if (!newSlideTitle.trim() || !newSlideText.trim()) return;
    setEditingTv({
      ...editingTv,
      slides: [...(editingTv.slides || []), { title: newSlideTitle.trim(), text: newSlideText.trim(), type: "info" }]
    });
    setNewSlideTitle("");
    setNewSlideText("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
          Modo Prioritário (Fallback: Canal → Playlist → Slides)
        </label>
        <div className="grid grid-cols-3 gap-2 bg-emerald-50/50 p-1.5 rounded-2xl">
          <button
            onClick={() => setEditingTv({ ...editingTv, mode: "channel" })}
            className={`py-3 flex flex-col items-center gap-1 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
              editingTv.mode === "channel"
                ? "bg-sefaz-accent text-white shadow-md"
                : "text-sefaz-accent opacity-60 hover:bg-emerald-100"
            }`}
          >
            <PlayCircle size={16} />
            Canal
          </button>
          <button
            onClick={() => setEditingTv({ ...editingTv, mode: "playlist" })}
            className={`py-3 flex flex-col items-center gap-1 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
              editingTv.mode === "playlist"
                ? "bg-sefaz-accent text-white shadow-md"
                : "text-sefaz-accent opacity-60 hover:bg-emerald-100"
            }`}
          >
            <ListVideo size={16} />
            Playlist
          </button>
          <button
            onClick={() => setEditingTv({ ...editingTv, mode: "slides" })}
            className={`py-3 flex flex-col items-center gap-1 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer ${
              editingTv.mode === "slides"
                ? "bg-sefaz-accent text-white shadow-md"
                : "text-sefaz-accent opacity-60 hover:bg-emerald-100"
            }`}
          >
            <Presentation size={16} />
            Slides
          </button>
        </div>
      </div>

      {editingTv.mode === "channel" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Definir Canal do YouTube
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChannelUrl}
                onChange={(e) => setNewChannelUrl(e.target.value)}
                placeholder="Ex: https://youtube.com/@NomeDoCanal"
                className="flex-1 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-medium text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSetChannel();
                }}
              />
              <button
                onClick={handleSetChannel}
                disabled={!newChannelUrl.trim()}
                className="px-6 py-4 bg-sefaz-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all disabled:opacity-50 cursor-pointer"
              >
                Definir
              </button>
            </div>
            <p className="text-[10px] text-sefaz-accent/70 pl-2">
              O sistema buscará automaticamente a Live em andamento ou os vídeos mais recentes deste canal.
            </p>
          </div>

          {editingTv.youtubeChannel && (
            <div className="space-y-2 mt-4">
              <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
                Canal Atual
              </label>
              <div className="bg-white rounded-2xl border border-emerald-100 p-3 flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-red-50 flex items-center justify-center text-red-500 relative">
                  {channelMeta?.avatarUrl ? (
                    <Image src={channelMeta.avatarUrl} fill={true} style={{ objectFit: 'cover' }} alt="Avatar do Canal" />
                  ) : (
                    <PlayCircle size={24} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-sefaz-dark truncate">{channelMeta?.title || editingTv.youtubeChannel.split('/').pop() || "Canal"}</p>
                  <p className="text-[10px] text-gray-500 truncate">{editingTv.youtubeChannel}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTv({...editingTv, youtubeChannel: undefined});
                  }}
                  className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {editingTv.mode === "playlist" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
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
      )}

      {editingTv.mode === "slides" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-4 border border-emerald-50 p-6 rounded-3xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-sefaz-dark uppercase">Imagens Atuais</p>
                <p className="text-[9px] text-sefaz-accent font-bold uppercase opacity-60">Imagens para exibição</p>
              </div>
              <button
                onClick={handleTvUpload}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer"
              >
                Carregar Imagens
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

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
              Textos em Tela Cheia
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={newSlideTitle}
                onChange={(e) => setNewSlideTitle(e.target.value)}
                placeholder="Título do texto..."
                className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-medium text-xs"
              />
              <textarea
                value={newSlideText}
                onChange={(e) => setNewSlideText(e.target.value)}
                placeholder="Mensagem..."
                rows={2}
                className="w-full p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-medium text-xs resize-none"
              />
              <button
                onClick={handleAddSlide}
                disabled={!newSlideTitle.trim() || !newSlideText.trim()}
                className="w-full py-4 bg-sefaz-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all disabled:opacity-50 cursor-pointer"
              >
                Adicionar Texto
              </button>
            </div>
          </div>

          {editingTv.slides && editingTv.slides.length > 0 && (
            <div className="grid grid-cols-1 gap-2 pt-2">
              {editingTv.slides.map((slide, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-emerald-100 p-3 flex gap-4 items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-sefaz-dark truncate">{slide.title}</p>
                    <p className="text-[10px] text-sefaz-dark/70 line-clamp-2 mt-1">{slide.text}</p>
                  </div>
                  <button
                    onClick={() => {
                      const newList = [...editingTv.slides];
                      newList.splice(idx, 1);
                      setEditingTv({...editingTv, slides: newList});
                    }}
                    className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Marquee Messages - Sempre visível embaixo */}
      <div className="space-y-4 pt-6 border-t border-emerald-100/50">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest pl-2">
            Mensagens do Rodapé (Letreiro)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMarquee}
              onChange={(e) => setNewMarquee(e.target.value)}
              placeholder="Digite uma nova mensagem..."
              className="flex-1 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 outline-none focus:border-sefaz-accent font-medium text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddMarquee();
              }}
            />
            <button
              onClick={handleAddMarquee}
              disabled={!newMarquee.trim()}
              className="px-6 py-4 bg-sefaz-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sefaz-dark transition-all disabled:opacity-50 cursor-pointer"
            >
              Adicionar
            </button>
          </div>
        </div>

        {editingTv.marqueeMessages && editingTv.marqueeMessages.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {editingTv.marqueeMessages.map((msg, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-emerald-100 p-3 flex gap-4 items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-sefaz-dark truncate">{msg}</p>
                </div>
                <button
                  onClick={() => {
                    const newList = [...editingTv.marqueeMessages];
                    newList.splice(idx, 1);
                    setEditingTv({...editingTv, marqueeMessages: newList});
                  }}
                  className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
