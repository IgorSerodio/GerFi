"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { getQueueStateAction } from "@/features/queue/actions";
import { getTvSettingsAction } from "@/features/tv/actions";
import { Ticket } from "@/features/queue/types";
import { TvSettings } from "@/features/tv/types";

import TvHeader from "./TvHeader";
import MainCallDisplay from "./MainCallDisplay";
import MiddleBar from "./MiddleBar";
import HistorySidebar from "./HistorySidebar";
import TvFooter from "./TvFooter";
import { useQueueStream } from "@/features/queue/hooks/useQueueStream";


interface TvDashboardProps {
  initialHistory: Ticket[];
  initialSettings: TvSettings;
}

export default function TvDashboard({
  initialHistory,
  initialSettings,
}: TvDashboardProps) {
  const [currentCall, setCurrentCall] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<Ticket[]>(initialHistory);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [showControls, setShowControls] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [tvSettings, setTvSettings] = useState<TvSettings>(initialSettings);
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const getPlaylistUrl = () => {
    if (!tvSettings.videoUrl || tvSettings.videoUrl.length === 0) return "";

    const firstVideoId = tvSettings.videoUrl[0].videoId;
    let url = `https://www.youtube.com/embed/${firstVideoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&loop=1`;

    if (tvSettings.videoUrl.length === 1) {
      url += `&playlist=${firstVideoId}`;
    } else {
      const remainingIds = tvSettings.videoUrl
        .slice(1)
        .map((v) => v.videoId)
        .join(",");
      url += `&playlist=${remainingIds},${firstVideoId}`;
    }

    return url;
  };

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevCallIdRef = useRef<string | null>(null);
  const prevCalledAtRef = useRef<string | null>(null);

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

  const stateRef = useRef({
    locationId: tvSettings.locationId,
    services: tvSettings.services,
    slug: tvSettings.slug,
    soundEnabled,
    volume,
  });

  useEffect(() => {
    stateRef.current = {
      locationId: tvSettings.locationId,
      services: tvSettings.services,
      slug: tvSettings.slug,
      soundEnabled,
      volume,
    };
  }, [tvSettings.locationId, tvSettings.services, tvSettings.slug, soundEnabled, volume]);

  const playAlert = useCallback((currentVol?: number) => {
    try {
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
      );
      audio.volume = currentVol ?? stateRef.current.volume;
      audio.play().catch((e) => console.log("Audio play blocked", e));
    } catch (e) {
      console.log("Audio error", e);
    }
  }, []);

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

  const refreshState = useCallback(async () => {
    const { locationId, services, slug, soundEnabled: sEnabled, volume: vol } = stateRef.current;

    const [queueRes, tvRes] = await Promise.all([
      getQueueStateAction(locationId, services),
      getTvSettingsAction(slug),
    ]);

    if (tvRes.success && tvRes.data) {
      setTvSettings(tvRes.data);
    }

    if (queueRes.success && queueRes.data) {
      const hist = queueRes.data.history;
      setHistory(hist);

      if (hist.length > 0) {
        const first = hist[0];

        if (first.status === "calling") {
          setCurrentCall(first);
          setIsIdle(false);
          resetIdleTimer();

          const latestCallTime = first.recallHistory && first.recallHistory.length > 0 
            ? first.recallHistory[first.recallHistory.length - 1] 
            : (first.calledAt || "");

          if ((first.id !== prevCallIdRef.current || latestCallTime !== prevCalledAtRef.current) && sEnabled) {
            playAlert(vol);
          }
          prevCallIdRef.current = first.id;
          prevCalledAtRef.current = latestCallTime;
        } else {
          setCurrentCall(null);
          setIsIdle(true);
        }
      } else {
        setCurrentCall(null);
        setIsIdle(true);
      }
    }
  }, [playAlert]);



  useEffect(() => {
    setTimeout(() => {
      refreshState();
    }, 0);
  }, [soundEnabled, refreshState]);

  useQueueStream(() => refreshState());

  useEffect(() => {
    const slideTimer = setInterval(() => {
      if (tvSettings.uploadedFiles.length > 0) {
        setSlideIndex((prev) => (prev + 1) % tvSettings.uploadedFiles.length);
      } else {
        setSlideIndex((prev) => (prev + 1) % defaultSlides.length);
      }
    }, 8000);

    return () => clearInterval(slideTimer);
  }, [tvSettings.uploadedFiles, defaultSlides.length]);

  useEffect(() => {
    setTimeout(() => {
      resetControlsTimer();
    }, 0);
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const showMiddleBar = !soundEnabled || showControls;

  const recentTickets = history.slice(isIdle ? 0 : 1, isIdle ? 5 : 6);
  const duplicatedTickets = [...recentTickets, ...recentTickets];
  const scrollDuration = recentTickets.length * 4;

  return (
    <div
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      className="h-screen w-full bg-sefaz-light flex flex-col p-4 md:p-8 gap-4 md:gap-8 font-display overflow-hidden select-none"
    >
      <TvHeader time={time} />

      <div className="flex-1 flex flex-row items-stretch relative z-10 min-h-0">
        <MainCallDisplay
          isIdle={isIdle}
          currentCall={currentCall}
          tvSettings={tvSettings}
          slideIndex={slideIndex}
          defaultSlides={defaultSlides}
          getPlaylistUrl={getPlaylistUrl}
        />

        <div className="w-15 h-full shrink-0">
          <MiddleBar
            showMiddleBar={showMiddleBar}
            soundEnabled={soundEnabled}
            volume={volume}
            setSoundEnabled={setSoundEnabled}
            playAlert={playAlert}
            setVolume={setVolume}
          />
        </div>

        <HistorySidebar
          recentTickets={recentTickets}
          duplicatedTickets={duplicatedTickets}
          scrollDuration={scrollDuration}
        />
      </div>

      <TvFooter />
    </div>
  );
}
