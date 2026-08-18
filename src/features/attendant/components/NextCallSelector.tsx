import React from "react";
import { Users } from "lucide-react";

interface NextCallSelectorProps {
  allowedServicesCount: number;
  availableNormalCount: number;
  availablePriorityCount: number;
  canCallNormal: boolean;
  canCallPriority: boolean;
  forwardedCount: number;
  handleCall: (priorityType?: "Normal" | "Prioritário") => void;
  handleCallForwarded: () => void;
  isCalling: boolean;
}

export function NextCallSelector({
  availableNormalCount,
  availablePriorityCount,
  canCallNormal,
  canCallPriority,
  forwardedCount,
  handleCall,
  handleCallForwarded,
  isCalling,
}: NextCallSelectorProps) {
  return (
    <div className="text-center space-y-2 py-2">
      <div className="w-12 h-12 bg-sefaz-light rounded-full flex items-center justify-center mx-auto text-sefaz-accent animate-pulse">
        <Users size={24} />
      </div>
      <div>
        <h3 className="text-[clamp(1.25rem,2vw,2rem)] font-black text-sefaz-dark">
          Ninguém sendo atendido
        </h3>
        <p className="text-[clamp(0.875rem,1.2vw,1.125rem)] text-sefaz-accent/60 font-medium">
          Escolha qual fila deseja chamar
        </p>
      </div>
      <div className="flex gap-4 w-full px-8 max-w-4xl mx-auto">
        {forwardedCount > 0 ? (
          <button
            onClick={handleCallForwarded}
            disabled={isCalling}
            className="flex-1 px-4 py-2 min-h-[3rem] lg:min-h-[4rem] text-white rounded-xl font-black text-[clamp(0.875rem,1.2vw,1.25rem)] transition-all flex flex-col items-center justify-center gap-1 bg-amber-400 hover:bg-amber-500 hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="whitespace-nowrap">{isCalling ? "CHAMANDO..." : "CHAMAR ENCAMINHADO"}</span>
            <span className="text-[clamp(0.75rem,1.2vw,1.25rem)] font-bold opacity-80">{forwardedCount} na fila</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => handleCall("Prioritário")}
              disabled={availablePriorityCount === 0 || !canCallPriority || isCalling}
              className={`flex-1 px-4 py-2 min-h-[3rem] lg:min-h-[4rem] text-white rounded-xl font-black text-[clamp(0.875rem,1.2vw,1.25rem)] transition-all flex flex-col items-center justify-center gap-1 ${
                canCallPriority
                  ? "bg-amber-500 hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/20 cursor-pointer disabled:grayscale disabled:opacity-50"
                  : "bg-gray-400 cursor-not-allowed opacity-50"
              }`}
              title={!canCallPriority ? "Você não tem permissão para chamar esta fila." : undefined}
            >
              <span className="whitespace-nowrap">{isCalling ? "CHAMANDO..." : "CHAMAR PRIORIDADE"}</span>
              <span className="text-[clamp(0.75rem,1.2vw,1.25rem)] font-bold opacity-80">{availablePriorityCount} na fila</span>
            </button>
            <button
              onClick={() => handleCall("Normal")}
              disabled={availableNormalCount === 0 || !canCallNormal || isCalling}
              className={`flex-1 px-4 py-2 min-h-[3rem] lg:min-h-[4rem] text-white rounded-xl font-black text-[clamp(0.875rem,1.2vw,1.25rem)] transition-all flex flex-col items-center justify-center gap-1 ${
                canCallNormal
                  ? "bg-sefaz-accent hover:scale-105 active:scale-95 shadow-xl shadow-emerald-950/30 cursor-pointer disabled:grayscale disabled:opacity-50"
                  : "bg-gray-400 cursor-not-allowed opacity-50"
              }`}
              title={!canCallNormal ? "Você não tem permissão para chamar esta fila." : undefined}
            >
              <span className="whitespace-nowrap">{isCalling ? "CHAMANDO..." : "CHAMAR NORMAL"}</span>
              <span className="text-[clamp(0.75rem,1.2vw,1.25rem)] font-bold opacity-80">{availableNormalCount} na fila</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
