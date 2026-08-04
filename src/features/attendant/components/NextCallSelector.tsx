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
}

export function NextCallSelector({
  allowedServicesCount,
  availableNormalCount,
  availablePriorityCount,
  canCallNormal,
  canCallPriority,
  forwardedCount,
  handleCall,
  handleCallForwarded,
}: NextCallSelectorProps) {
  return (
    <div className="text-center space-y-8 py-10">
      <div className="w-24 h-24 bg-sefaz-light rounded-full flex items-center justify-center mx-auto text-sefaz-accent animate-pulse">
        <Users size={48} />
      </div>
      <div>
        <h3 className="text-[clamp(1.5rem,3vw,3rem)] font-black text-sefaz-dark">
          Ninguém sendo atendido
        </h3>
        <p className="text-[clamp(1rem,1.5vw,1.5rem)] text-sefaz-accent/60 font-medium">
          Escolha qual fila deseja chamar
        </p>
        {allowedServicesCount > 0 && (
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">
            Filtrando por {allowedServicesCount} serviços selecionados
          </p>
        )}
      </div>
      <div className="flex gap-4 w-full px-8 max-w-4xl mx-auto">
        {forwardedCount > 0 ? (
          <button
            onClick={handleCallForwarded}
            className="flex-1 px-[2vw] py-[3vh] min-h-[6rem] lg:min-h-[8rem] text-white rounded-[clamp(1rem,2vw,2rem)] font-black text-[clamp(1rem,1.5vw,1.5rem)] transition-all flex flex-col items-center justify-center gap-1 bg-amber-400 hover:bg-amber-500 hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/20 cursor-pointer"
          >
            <span className="whitespace-nowrap">CHAMAR ENCAMINHADO</span>
            <span className="text-[clamp(0.75rem,1.2vw,1.25rem)] font-bold opacity-80">{forwardedCount} na fila</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => handleCall("Prioritário")}
              disabled={availablePriorityCount === 0 || !canCallPriority}
              className={`flex-1 px-[2vw] py-[3vh] min-h-[6rem] lg:min-h-[8rem] text-white rounded-[clamp(1rem,2vw,2rem)] font-black text-[clamp(1rem,1.5vw,1.5rem)] transition-all flex flex-col items-center justify-center gap-1 ${
                canCallPriority
                  ? "bg-amber-500 hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/20 cursor-pointer disabled:grayscale disabled:opacity-50"
                  : "bg-gray-400 cursor-not-allowed opacity-50"
              }`}
              title={!canCallPriority ? "Você não tem permissão para chamar esta fila." : undefined}
            >
              <span className="whitespace-nowrap">CHAMAR PRIORIDADE</span>
              <span className="text-[clamp(0.75rem,1.2vw,1.25rem)] font-bold opacity-80">{availablePriorityCount} na fila</span>
            </button>
            <button
              onClick={() => handleCall("Normal")}
              disabled={availableNormalCount === 0 || !canCallNormal}
              className={`flex-1 px-[2vw] py-[3vh] min-h-[6rem] lg:min-h-[8rem] text-white rounded-[clamp(1rem,2vw,2rem)] font-black text-[clamp(1rem,1.5vw,1.5rem)] transition-all flex flex-col items-center justify-center gap-1 ${
                canCallNormal
                  ? "bg-sefaz-accent hover:scale-105 active:scale-95 shadow-xl shadow-emerald-950/30 cursor-pointer disabled:grayscale disabled:opacity-50"
                  : "bg-gray-400 cursor-not-allowed opacity-50"
              }`}
              title={!canCallNormal ? "Você não tem permissão para chamar esta fila." : undefined}
            >
              <span className="whitespace-nowrap">CHAMAR NORMAL</span>
              <span className="text-[clamp(0.75rem,1.2vw,1.25rem)] font-bold opacity-80">{availableNormalCount} na fila</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
