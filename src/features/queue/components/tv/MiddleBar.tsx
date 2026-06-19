import React from "react";
import { Play, Volume2 } from "lucide-react";

interface MiddleBarProps {
  showMiddleBar: boolean;
  soundEnabled: boolean;
  volume: number;
  setSoundEnabled: (enabled: boolean) => void;
  playAlert: () => void;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
}

export default function MiddleBar({
  showMiddleBar,
  soundEnabled,
  volume,
  setSoundEnabled,
  playAlert,
  setVolume,
}: MiddleBarProps) {
  if (!showMiddleBar) return null;

  return (
    <>
      {!soundEnabled ? (
        <button
          onClick={() => {
            setSoundEnabled(true);
            playAlert();
          }}
          className="w-full h-full text-amber-600 font-black uppercase rounded-[20px] flex flex-col justify-center items-center gap-4 py-8 px-1 z-20 cursor-pointer transition-all hover:scale-[1.05] active:scale-95 duration-200 group"
        >
          <Play
            size={16}
            className="animate-bounce shrink-0 text-amber-500"
          />
          <span
            className="tracking-[0.2em] text-[8px] whitespace-nowrap"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            ATIVAR ALERTAS SONOROS DA TV
          </span>
        </button>
      ) : (
        <div className="w-full h-full flex flex-col justify-between items-center rounded-[20px] py-8 px-1 z-20">
          <button
            onClick={() => setVolume((prev) => (prev === 0 ? 0.7 : 0))}
            className="w-8 h-8 bg-emerald-500 hover:bg-emerald-500/20 rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title={volume === 0 ? "Ativar som" : "Mutar som"}
          >
            <Volume2 size={14} className="text-white" />
          </button>

          <div className="flex-1 flex items-center justify-center py-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="h-56 w-1 bg-emerald-100 rounded-full cursor-pointer accent-emerald-500"
              style={
                {
                  writingMode: "vertical-lr",
                  direction: "rtl",
                  WebkitAppearance: "slider-vertical",
                } as React.CSSProperties
              }
            />
          </div>

          <div className="text-[8px] font-black text-emerald-800 tracking-wider">
            {Math.round(volume * 100)}%
          </div>
        </div>
      )}
    </>
  );
}
