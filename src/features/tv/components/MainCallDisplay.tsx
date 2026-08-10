import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ticket } from "@/features/queue/types";
import { TvSettings } from "@/features/tv/types";
import TvVideoPlayer from "./TvVideoPlayer";
import TvStandbyScreen from "./TvStandbyScreen";
import TvActiveCall from "./TvActiveCall";

interface MainCallDisplayProps {
  isIdle: boolean;
  currentCall: Ticket | null;
  tvSettings: TvSettings;
  slideIndex: number;
  slides: { title: string; text: string; type: string }[];
  currentVideoUrl: string;
  handleVideoError: () => void;
  handleVideoEnd: () => void;
  handleVideoStart: () => void;
  useSlidesFallback: boolean;
  hasVideos: boolean;
  ticketWindows?: { name: string; alias?: string | null; label?: string | null }[];
}

export default function MainCallDisplay({
  isIdle,
  currentCall,
  tvSettings,
  slideIndex,
  slides,
  currentVideoUrl,
  handleVideoError,
  handleVideoEnd,
  handleVideoStart,
  useSlidesFallback,
  hasVideos,
  ticketWindows,
}: MainCallDisplayProps) {
  return (
    <div className="flex-1 flex flex-col h-full justify-between min-h-0">
      <div
        className="flex-1 bg-white rounded-[60px] flex flex-col items-center justify-center border-b-[12px] border-emerald-500 shadow-2xl relative z-20 overflow-hidden min-h-0 w-full"
        style={{ containerType: "size" }}
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Camada de Espera (Sempre montada para o vídeo não recarregar) */}
        <motion.div
          animate={{ opacity: !isIdle && currentCall ? 0 : 1 }}
          transition={{ duration: 0.4 }}
          style={{ pointerEvents: !isIdle && currentCall ? 'none' : 'auto' }}
          className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center bg-emerald-950 rounded-[45px] overflow-hidden"
        >
          {(!tvSettings.uploadedFiles?.length && hasVideos && !useSlidesFallback) ? (
            <TvVideoPlayer
              isIdle={isIdle}
              currentVideoUrl={currentVideoUrl}
              handleVideoError={handleVideoError}
              handleVideoEnd={handleVideoEnd}
              handleVideoStart={handleVideoStart}
            />
          ) : (
            <TvStandbyScreen 
              tvSettings={tvSettings} 
              slideIndex={slideIndex} 
              slides={slides} 
            />
          )}
        </motion.div>

        {/* Camada da Senha */}
        <AnimatePresence>
          {!isIdle && currentCall && (
            <TvActiveCall 
              currentCall={currentCall} 
              ticketWindows={ticketWindows} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
