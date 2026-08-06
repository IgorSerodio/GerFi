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
          className="w-full h-full text-amber-600 font-black uppercase rounded-[1vw] flex flex-col justify-center items-center gap-[1vw] py-[2vh] px-[0.2vw] z-20 cursor-pointer transition-all hover:scale-[1.05] active:scale-95 duration-200 group"
        >
          <Play
            className="animate-bounce shrink-0 text-amber-500 w-[2vh] h-[2vh]"
          />
          <span
            className="tracking-[0.2em] text-[1vh] whitespace-nowrap"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            ATIVAR ALERTAS SONOROS DA TV
          </span>
        </button>
      ) : (
        <div className="w-full h-full flex flex-col justify-between items-center rounded-[1vw] py-[2vh] px-[0.2vw] z-20">
          <button
            onClick={() => setVolume((prev) => (prev === 0 ? 0.7 : 0))}
            className="w-[3vh] h-[3vh] bg-emerald-500 hover:bg-emerald-500/20 rounded-[0.5vw] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title={volume === 0 ? "Ativar som" : "Mutar som"}
          >
            <Volume2 className="text-white w-[1.5vh] h-[1.5vh]" />
          </button>

          <div className="flex-1 flex items-center justify-center py-[1vh]">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="h-[30vh] w-[0.3vw] bg-emerald-100 rounded-full cursor-pointer accent-emerald-500"
              style={
                {
                  writingMode: "vertical-lr",
                  direction: "rtl",
                  WebkitAppearance: "slider-vertical",
                } as React.CSSProperties
              }
            />
          </div>

          <div className="text-[1vh] font-black text-emerald-800 tracking-wider">
            {Math.round(volume * 100)}%
          </div>
        </div>
      )}
    </>
  );
}
