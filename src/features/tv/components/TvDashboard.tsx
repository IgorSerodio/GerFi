"use client";

import React from "react";
import { Ticket } from "@/features/queue/types";
import { TvSettings } from "@/features/tv/types";

import TvHeader from "./TvHeader";
import MainCallDisplay from "./MainCallDisplay";
import MiddleBar from "./MiddleBar";
import HistorySidebar from "./HistorySidebar";
import TvFooter from "./TvFooter";

import { useTvTimers } from "../hooks/useTvTimers";
import { useTvMedia } from "../hooks/useTvMedia";
import { useTvSync } from "../hooks/useTvSync";

interface TvDashboardProps {
  initialHistory: Ticket[];
  initialSettings: TvSettings;
}

export default function TvDashboard({
  initialHistory,
  initialSettings,
}: TvDashboardProps) {
  const { time, isIdle, setIsIdle, showControls, resetIdleTimer, resetControlsTimer } = useTvTimers();
  
  const {
    tvSettings,
    history,
    currentCall,
    volume,
    setVolume,
    soundEnabled,
    setSoundEnabled,
    playAlert,
  } = useTvSync(initialSettings, initialHistory, setIsIdle, resetIdleTimer);

  const { slideIndex, getPlaylistUrl, defaultSlides } = useTvMedia(tvSettings);

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
