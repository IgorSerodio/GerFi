import React, { useState, useEffect } from "react";
import { PhoneForwarded, Send, CheckCircle2, Users, UserX } from "lucide-react";
import { Ticket } from "@/features/queue/types";
import WaitTimer from "./WaitTimer";

interface ActiveCallCardProps {
  currentCall?: Ticket;
  allowedServicesCount: number;
  availableNormalCount: number;
  availablePriorityCount: number;
  canCallNormal: boolean;
  canCallPriority: boolean;
  forwardedCount: number;
  handleCall: (priorityType?: "Normal" | "Prioritário") => void;
  handleCallForwarded: () => void;
  handleRecall: (ticketId: string) => void;
  handleNoShow: (ticketId: string) => void;
  setShowForwardModal: (show: boolean) => void;
  setShowStartModal: (show: boolean) => void;
  handleFinish: (ticketId: string) => void;
  categories: { id: string; name: string; expectedTimeNormal: number; expectedTimePriority: number }[];
}

export default function ActiveCallCard({
  currentCall,
  allowedServicesCount,
  availableNormalCount,
  availablePriorityCount,
  canCallNormal,
  canCallPriority,
  forwardedCount,
  handleCall,
  handleCallForwarded,
  handleRecall,
  handleNoShow,
  setShowForwardModal,
  setShowStartModal,
  handleFinish,
  categories,
}: ActiveCallCardProps) {
  const currentCategory = categories?.find((c) => c.id === String(currentCall?.categoryId));
  
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const RECALL_COOLDOWN_MS = 15000;

  useEffect(() => {
    if (!currentCall || currentCall.status === "started") return;

    const checkCooldown = () => {
      const now = Date.now();
      const lastCallTime = currentCall.calledAt ? new Date(currentCall.calledAt).getTime() : 0;
      const timeSinceLastCall = now - lastCallTime;
      if (timeSinceLastCall < RECALL_COOLDOWN_MS) {
        setCooldownLeft(Math.ceil((RECALL_COOLDOWN_MS - timeSinceLastCall) / 1000));
      } else {
        setCooldownLeft(0);
      }
    };

    checkCooldown(); // initial check
    const intervalId = setInterval(checkCooldown, 1000);

    return () => clearInterval(intervalId);
  }, [currentCall]);

  const recallCount = currentCall?.recallHistory?.length || 0;
  const canRecall = cooldownLeft === 0;

  return (
    <div className="bg-white rounded-[40px] shadow-sm border-2 border-emerald-50 p-10 flex flex-col items-center min-h-[400px] justify-center shadow-glow">
      {currentCall ? (
        <div className="w-full text-center space-y-6 animate-fade-in">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="inline-block px-4 py-1.5 bg-emerald-50 text-sefaz-accent rounded-full font-black text-xs tracking-widest border border-emerald-100 uppercase">
              {currentCall.status === "started" ? "Em Atendimento" : "Em Chamada"}
            </div>
            <WaitTimer
              createdAt={currentCall.createdAt}
              calledAt={currentCall.calledAt}
              expectedTimeNormal={currentCategory?.expectedTimeNormal || 30}
              expectedTimePriority={currentCategory?.expectedTimePriority || 30}
              priority={currentCall.priority}
              className="mt-2 scale-110"
            />
          </div>
          <h3 className={`text-[10rem] font-black leading-none drop-shadow-sm mb-4 ${currentCall.priority === "Prioritário" ? "text-red-600" : "text-sefaz-accent"}`}>
            {currentCall.ticketNumber}
          </h3>
          <div className="flex flex-wrap justify-center gap-4 w-full max-w-3xl">
            {currentCall.status !== "started" ? (
              <>
                <button
                  onClick={() => handleRecall(currentCall.id)}
                  disabled={!canRecall}
                  className={`min-w-[160px] flex-1 px-4 py-6 border-2 border-emerald-100 rounded-3xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
                    canRecall 
                      ? "bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                  }`}
                >
                  <PhoneForwarded size={24} className="shrink-0" />
                  <span className="text-left leading-tight text-sm sm:text-base">
                    {canRecall ? "RECHAMAR" : `AGUARDE (${cooldownLeft}s)`}
                  </span>
                </button>
                {recallCount >= 3 && (
                  <button
                    onClick={() => handleNoShow(currentCall.id)}
                    className="min-w-[160px] flex-1 px-4 py-6 bg-red-50 text-red-600 border-2 border-red-200 rounded-3xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <UserX size={24} className="shrink-0" />
                    <div className="flex flex-col items-center text-center leading-tight text-sm sm:text-base">
                      <span>NÃO</span>
                      <span>COMPARECEU</span>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => setShowStartModal(true)}
                  className="min-w-[160px] flex-1 px-4 py-6 bg-sefaz-accent text-white rounded-3xl font-bold hover:bg-sefaz-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  <CheckCircle2 size={24} className="shrink-0" />
                  <span className="text-left leading-tight text-sm sm:text-base">INICIAR</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowForwardModal(true)}
                  className="min-w-[160px] flex-1 px-4 py-6 bg-white text-amber-600 border-2 border-amber-100 rounded-3xl font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Send size={24} className="shrink-0" />
                  <span className="text-left leading-tight text-sm sm:text-base">ENCAMINHAR</span>
                </button>
                <button
                  onClick={() => handleFinish(currentCall.id)}
                  className="min-w-[160px] flex-1 px-4 py-6 bg-sefaz-accent text-white rounded-3xl font-bold hover:bg-sefaz-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  <CheckCircle2 size={24} className="shrink-0" />
                  <span className="text-left leading-tight text-sm sm:text-base">FINALIZAR</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center space-y-8 py-10">
          <div className="w-24 h-24 bg-sefaz-light rounded-full flex items-center justify-center mx-auto text-sefaz-accent animate-pulse">
            <Users size={48} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-sefaz-dark">
              Ninguém sendo atendido
            </h3>
            <p className="text-sefaz-accent/60 font-medium">
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
                className="flex-1 px-4 py-6 text-white rounded-3xl font-black text-base sm:text-lg transition-all flex flex-col items-center gap-1 bg-amber-400 hover:bg-amber-500 hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/20 cursor-pointer"
              >
                <span className="whitespace-nowrap">CHAMAR ENCAMINHADO</span>
                <span className="text-sm font-bold opacity-80">{forwardedCount} na fila</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleCall("Prioritário")}
                  disabled={availablePriorityCount === 0 || !canCallPriority}
                  className={`flex-1 px-4 py-6 text-white rounded-3xl font-black text-base sm:text-lg transition-all flex flex-col items-center gap-1 ${
                    canCallPriority
                      ? "bg-amber-500 hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/20 cursor-pointer disabled:grayscale disabled:opacity-50"
                      : "bg-gray-400 cursor-not-allowed opacity-50"
                  }`}
                  title={!canCallPriority ? "Você não tem permissão para chamar esta fila." : undefined}
                >
                  <span className="whitespace-nowrap">CHAMAR PRIORIDADE</span>
                  <span className="text-sm font-bold opacity-80">{availablePriorityCount} na fila</span>
                </button>
                <button
                  onClick={() => handleCall("Normal")}
                  disabled={availableNormalCount === 0 || !canCallNormal}
                  className={`flex-1 px-4 py-6 text-white rounded-3xl font-black text-base sm:text-lg transition-all flex flex-col items-center gap-1 ${
                    canCallNormal
                      ? "bg-sefaz-accent hover:scale-105 active:scale-95 shadow-xl shadow-emerald-950/30 cursor-pointer disabled:grayscale disabled:opacity-50"
                      : "bg-gray-400 cursor-not-allowed opacity-50"
                  }`}
                  title={!canCallNormal ? "Você não tem permissão para chamar esta fila." : undefined}
                >
                  <span className="whitespace-nowrap">CHAMAR NORMAL</span>
                  <span className="text-sm font-bold opacity-80">{availableNormalCount} na fila</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
