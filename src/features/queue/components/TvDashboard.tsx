"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, Clock, Play, X, ArrowLeft } from "lucide-react";
import NextLink from "next/link";
import { getQueueStateAction, getTvSettingsAction } from "@/features/queue/actions";
import { Ticket, TvSettings } from "@/features/queue/types";

interface TvDashboardProps {
  initialHistory: Ticket[];
  initialSettings: TvSettings;
}

export default function TvDashboard({ initialHistory, initialSettings }: TvDashboardProps) {
  const [currentCall, setCurrentCall] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<Ticket[]>(initialHistory);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [showControls, setShowControls] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [tvSettings, setTvSettings] = useState<TvSettings>(initialSettings);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let embedUrl = url;
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    const separator = embedUrl.includes("?") ? "&" : "?";
    return `${embedUrl}${separator}autoplay=1&mute=0&controls=0&rel=0&modestbranding=1`;
  };

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevCallIdRef = useRef<string | null>(null);

  const defaultSlides = [
    {
      title: "IPTU 2026",
      text: "Pague sua cota única até Abril e receba 20% de desconto. Contribua com o crescimento de Caruaru.",
      type: "tax",
    },
    {
      title: "Nota Fiscal Caruaruense",
      text: "Peça seu CPF na nota e participe de sorteios mensais de até R$ 10.000,00.",
      type: "program",
    },
    {
      title: "Atendimento Online",
      text: "Evite filas! Mais de 50 serviços disponíveis no portal caruaru.pe.gov.br",
      type: "tax",
    },
    {
      title: "SEFAZ Informa",
      text: "Novos canais de atendimento via WhatsApp: (81) 99999-9999",
      type: "news",
    },
  ];

  const refreshState = async () => {
    const [queueRes, tvRes] = await Promise.all([getQueueStateAction(), getTvSettingsAction()]);

    if (tvRes.success && tvRes.data) {
      setTvSettings(tvRes.data);
    }

    if (queueRes.success && queueRes.data) {
      const hist = queueRes.data.history;
      setHistory(hist);

      if (hist.length > 0) {
        const first = hist[0];
        
        // Se mudou o ID chamado e não é completed, exibe o ticket em destaque
        if (first.status === "calling") {
          setCurrentCall(first);
          setIsIdle(false);
          resetIdleTimer();

          // Toca som se for um novo ticket ou se a chamada foi acionada
          if (first.id !== prevCallIdRef.current && soundEnabled) {
            playAlert();
          }
          prevCallIdRef.current = first.id;
        } else {
          setCurrentCall(null);
          setIsIdle(true);
        }
      } else {
        setCurrentCall(null);
        setIsIdle(true);
      }
    }
  };

  function resetIdleTimer() {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 30000); // 30 seconds
  }

  function resetControlsTimer() {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000); // 5 seconds
  }

  function playAlert() {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = volume;
      audio.play().catch((e) => console.log("Audio play blocked", e));
    } catch (e) {
      console.log("Audio error", e);
    }
  }

  useEffect(() => {
    setTimeout(() => {
      refreshState();
    }, 0);
  }, [soundEnabled]);

  // Sincronização SSE
  useEffect(() => {
    const eventSource = new EventSource("/api/queue/stream");

    eventSource.addEventListener("update", () => {
      setTimeout(() => {
        refreshState();
      }, 0);
    });

    return () => {
      eventSource.close();
    };
  }, [soundEnabled]);

  // Slide interval logic
  useEffect(() => {
    const slideTimer = setInterval(() => {
      if (tvSettings.uploadedFiles.length > 0) {
        setSlideIndex((prev) => (prev + 1) % tvSettings.uploadedFiles.length);
      } else {
        setSlideIndex((prev) => (prev + 1) % defaultSlides.length);
      }
    }, 8000);

    return () => clearInterval(slideTimer);
  }, [tvSettings.uploadedFiles]);

  useEffect(() => {
    setTimeout(() => {
      resetControlsTimer();
    }, 0);
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const showMiddleBar = !soundEnabled || (isIdle && showControls);

  return (
    <div
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      className="h-screen w-full bg-sefaz-light flex flex-col p-4 md:p-8 gap-4 md:gap-8 font-display overflow-hidden select-none"
    >
      {/* Header: Branding & Massive Clock */}
      <header className="flex justify-between items-center bg-white rounded-[30px] p-4 shadow-xl border border-emerald-50/50 h-20 shrink-0">
        <div className="flex items-center gap-4">
          <NextLink
            href="/"
            className="w-12 h-12 bg-emerald-50 hover:bg-emerald-100 text-sefaz-accent rounded-2xl flex items-center justify-center p-2.5 shadow-inner hover:scale-105 transition-transform"
          >
            <ArrowLeft size={20} />
          </NextLink>
          <div>
            <h1 className="text-2xl font-black text-emerald-950 uppercase tracking-tight leading-none mb-0.5">
              Prefeitura de Caruaru
            </h1>
            <p className="text-emerald-600 font-bold uppercase tracking-[0.3em] text-[8px] opacity-70">
              Secretaria da Fazenda Municipal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-4xl font-black text-emerald-900 tracking-tighter tabular-nums leading-none">
              {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-emerald-500 font-black uppercase tracking-widest text-[8px] mt-0.5 pr-1">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-row items-stretch relative z-10">
        {/* Left: Current Ticket Called (Main Visual) */}
        <div className="flex-1 flex flex-col h-full justify-between">
          <div className="flex-1 bg-white rounded-[60px] flex flex-col items-center justify-center border-b-[12px] border-emerald-500 shadow-2xl relative z-20 overflow-hidden">
            {/* Background Decorative patterns */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
              <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
            </div>

            <AnimatePresence mode="wait">
              {!isIdle && currentCall ? (
                <motion.div
                  key={`call-${currentCall.id}`}
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -50 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="flex flex-col items-center justify-center w-full relative z-10 px-20 text-center"
                >
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4 mb-8"
                  >
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" />
                    <span className="text-emerald-900 font-black uppercase tracking-[0.4em] text-2xl drop-shadow-sm">
                      SENHA CHAMADA
                    </span>
                  </motion.div>

                  <div className="relative">
                    <div className="text-[20rem] font-black leading-none text-emerald-950 tracking-tighter drop-shadow-[0_20px_50px_rgba(6,78,59,0.3)]">
                      {currentCall.id}
                    </div>
                  </div>

                  <div className="w-full max-w-lg h-1.5 bg-emerald-100 rounded-full my-8 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>

                  <div className="flex gap-16 items-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-emerald-600/40 uppercase tracking-[0.3em] mb-4">
                        DIRIJA-SE AO
                      </span>
                      <div className="flex items-baseline gap-4 bg-emerald-950 text-white px-12 py-6 rounded-[40px] shadow-xl">
                        <span className="text-4xl font-light tracking-widest opacity-60">GUICHÊ</span>
                        <span className="text-9xl font-black leading-none tracking-tighter">
                          {currentCall.guiche?.split(" ")[1] || "01"}
                        </span>
                      </div>
                    </div>

                    <div className="h-24 w-px bg-emerald-100" />

                    <div className="text-left">
                      <span className="text-xs font-black text-emerald-600/40 uppercase tracking-[0.3em] mb-2 block">
                        ATENDENTE
                      </span>
                      <h3 className="text-5xl font-black text-emerald-950 uppercase tracking-tighter max-w-sm">
                        {currentCall.attendant}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center justify-center relative bg-emerald-950 rounded-[45px] overflow-hidden"
                >
                  {tvSettings.uploadedFiles.length > 0 ? (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={slideIndex}
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                          src={tvSettings.uploadedFiles[slideIndex]}
                          className="w-full h-full object-contain"
                          alt="TV Slide"
                        />
                      </AnimatePresence>
                    </div>
                  ) : tvSettings.liveUrl && tvSettings.liveUrl !== "" ? (
                    <div className="w-full h-full">
                      <iframe
                        src={getEmbedUrl(tvSettings.liveUrl)}
                        className="w-full h-full pointer-events-none"
                        allow="autoplay; encrypted-media"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                      <div className="absolute inset-0">
                        <img
                          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000"
                          className="w-full h-full object-cover opacity-10"
                          alt="Default Background"
                        />
                      </div>
                      <div className="relative z-20 text-center space-y-12 px-20">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={slideIndex}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -30, opacity: 0 }}
                            className="space-y-10"
                          >
                            <div className="w-24 h-2 bg-emerald-500 mx-auto rounded-full mb-8" />
                            <h2 className="text-8xl font-black text-white tracking-tighter leading-none drop-shadow-2xl uppercase">
                              {defaultSlides[slideIndex].title}
                            </h2>
                            <p className="text-4xl text-emerald-100/80 font-light leading-relaxed max-w-5xl mx-auto italic tracking-tight">
                              {defaultSlides[slideIndex].text}
                            </p>
                            <div className="w-24 h-2 bg-emerald-500/20 mx-auto rounded-full mt-8" />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Middle: Vertical Activation Banner / Volume Control / Spacer Gap */}
        <div className="w-15 h-full shrink-0">
          {showMiddleBar && (
            <>
              {!soundEnabled ? (
                <button
                  onClick={() => {
                    setSoundEnabled(true);
                    playAlert();
                  }}
                  className="w-full h-full text-amber-600 font-black uppercase rounded-[20px] flex flex-col justify-center items-center gap-4 py-8 px-1 z-20 cursor-pointer transition-all hover:scale-[1.05] active:scale-95 duration-200 group"
                >
                  <Play size={16} className="animate-bounce shrink-0 text-amber-500" />
                  <span className="tracking-[0.2em] text-[8px] whitespace-nowrap" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                    ATIVAR ALERTAS SONOROS DA TV
                  </span>
                </button>
              ) : (
                <div className="w-full h-full flex flex-col justify-between items-center rounded-[20px] py-8 px-1 z-20">
                  {/* Top: Mute/Unmute Button */}
                  <button
                    onClick={() => setVolume((prev) => (prev === 0 ? 0.7 : 0))}
                    className="w-8 h-8 bg-emerald-500 hover:bg-emerald-500/20 rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    title={volume === 0 ? "Ativar som" : "Mutar som"}
                  >
                    <Volume2 size={14} className="text-white" />
                  </button>

                  {/* Middle: Vertical Slider */}
                  <div className="flex-1 flex items-center justify-center py-4">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="h-56 w-1 bg-emerald-100 rounded-full cursor-pointer accent-emerald-500"
                      style={{
                        writingMode: "vertical-lr",
                        direction: "rtl",
                        WebkitAppearance: "slider-vertical",
                      } as React.CSSProperties}
                    />
                  </div>

                  {/* Bottom: Volume Percentage */}
                  <div className="text-[8px] font-black text-emerald-800 tracking-wider">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: History & Sidebranding */}
        <div className="w-1/3 shrink-0 flex flex-col h-full gap-8">
          <div className="flex-1 bg-white rounded-[60px] p-10 flex flex-col shadow-2xl border-t-[10px] border-emerald-500 relative z-20">
            <h2 className="text-emerald-950 font-black uppercase tracking-[0.3em] text-sm mb-12 flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500 text-white rounded-2xl">
                <Clock className="h-5 w-5" />
              </div>
              Últimas Chamadas
            </h2>

            <div className="flex-1 space-y-5">
              <AnimatePresence initial={false}>
                {history.slice(isIdle ? 0 : 1, 6).map((ticket, i) => (
                  <motion.div
                    key={`hist-${ticket.id}`}
                    layout
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 - i * 0.15 }}
                    className="relative group"
                  >
                    <div className="bg-emerald-50/50 hover:bg-emerald-50 p-6 rounded-[35px] flex justify-between items-center border border-emerald-100/50 transition-all hover:scale-[1.02] active:scale-100 shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="text-6xl font-black text-emerald-950 tracking-tighter leading-none">
                          {ticket.id}
                        </div>
                        <div className="h-10 w-px bg-emerald-200" />
                        <div>
                          <div className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mb-1 opacity-50 block">
                            GUICHÊ
                          </div>
                          <div className="text-2xl font-black text-emerald-950 uppercase tracking-tighter">
                            #{ticket.guiche?.split(" ")[1] || "01"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[20px] font-black text-emerald-600 tabular-nums tracking-tighter">
                          {new Date(ticket.calledAt || "").toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Área do QR code */}
            <div className="mt-auto pt-3 -mb-10">
              <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 p-2.5 rounded-2xl text-white shadow-2xl relative overflow-hidden group border border-white/10 w-max mx-auto">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16" />
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <div className="bg-white p-1 rounded-lg shadow-glow transform group-hover:scale-105 transition-transform shrink-0">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://sefaz.caruaru.pe.gov.br"
                      alt="QR Code"
                      className="w-14 h-14"
                    />
                  </div>
                  <div className="shrink-0 text-center">
                    <p className="text-[8px] uppercase font-black tracking-[0.3em] text-emerald-400">
                      ATENDIMENTO VIRTUAL
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Marquee / Breaking News */}
      <footer className="bg-emerald-950 text-white h-14 rounded-2xl flex items-center overflow-hidden shrink-0 border-t border-white/5 shadow-2xl px-6">
        <div className="flex-1 overflow-hidden relative z-10 h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap text-2xl font-bold opacity-90 uppercase tracking-tight inline-flex flex-row flex-nowrap shrink-0 items-center gap-20 w-max">
            <div className="inline-flex items-center gap-4 text-emerald-400 shrink-0 whitespace-nowrap">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" /> {"USE O PORTAL \"FAZENDA MUNICIPAL\" PARA CONSULTAS RÁPIDAS"}
            </div>
            <div className="inline-flex items-center gap-4 text-emerald-100 shrink-0 whitespace-nowrap">
              <div className="w-2 h-2 bg-white rounded-full" /> HORÁRIO DE ATENDIMENTO PRESENCIAL: 08H ÀS 14H
            </div>
            <div className="inline-flex items-center gap-4 text-emerald-400 shrink-0 whitespace-nowrap">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" /> ATENÇÃO: Contribuintes com parcelamento em atraso podem regularizar seus débitos
            </div>
            <div className="inline-flex items-center gap-4 text-emerald-100 shrink-0 whitespace-nowrap">
              <div className="w-2 h-2 bg-white rounded-full" /> EMISSÃO DE NOTA FISCAL ELETRÔNICA DISPONÍVEL 24H
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
