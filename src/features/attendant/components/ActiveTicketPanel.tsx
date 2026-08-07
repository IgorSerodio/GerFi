import React from "react";
import { PhoneForwarded, Send, CheckCircle2, UserX } from "lucide-react";
import { Ticket } from "@/features/queue/types";
import { getTicketStatusLabel } from "@/utils/ticketStatus";
import { getPriorityTextColorClass } from "@/utils/priorityVisuals";
import { useTicketRecallTimer } from "../hooks/useTicketRecallTimer";
import WaitTimer from "./WaitTimer";

interface ActiveTicketPanelProps {
  currentCall: Ticket;
  categories: { id: string; name: string; expectedTimeNormal: number; expectedTimePriority: number }[];
  handleRecall: (ticketId: string) => void;
  handleNoShow: (ticketId: string) => void;
  setShowStartModal: (show: boolean) => void;
  setShowForwardModal: (show: boolean) => void;
  handleFinish: (ticketId: string) => void;
}

export function ActiveTicketPanel({
  currentCall,
  categories,
  handleRecall,
  handleNoShow,
  setShowStartModal,
  setShowForwardModal,
  handleFinish,
}: ActiveTicketPanelProps) {
  const currentCategory = categories?.find((c) => c.id === String(currentCall.categoryId));
  const { cooldownLeft, canRecall, canMarkAsNoShow } = useTicketRecallTimer(currentCall);

  return (
    <div className="@container w-full text-center space-y-2 animate-fade-in">
      <div className="flex flex-col items-center gap-1 mb-2">
        <div className="inline-block px-4 py-1.5 bg-emerald-50 text-sefaz-accent rounded-full font-black text-xs tracking-widest border border-emerald-100 uppercase">
          {getTicketStatusLabel(currentCall.status)}
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
      <h3 className={`text-[clamp(2.5rem,10cqw,5rem)] font-black leading-none drop-shadow-sm mb-1 ${getPriorityTextColorClass(currentCall.priority, "text-sefaz-accent")}`}>
        {currentCall.ticketNumber}
      </h3>
      <div className="flex flex-wrap justify-center gap-4 w-full max-w-3xl">
        {currentCall.status !== "started" ? (
          <>
            <button
              onClick={() => handleRecall(currentCall.id)}
              disabled={!canRecall}
              className={`min-w-[120px] flex-1 px-4 py-2 border-2 border-emerald-100 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
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
            {canMarkAsNoShow && (
              <button
                onClick={() => handleNoShow(currentCall.id)}
                className="min-w-[120px] flex-1 px-4 py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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
              className="min-w-[120px] flex-1 px-4 py-2 bg-sefaz-accent text-white rounded-xl font-bold hover:bg-sefaz-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
            >
              <CheckCircle2 size={24} className="shrink-0" />
              <span className="text-left leading-tight text-sm sm:text-base">INICIAR</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowForwardModal(true)}
              className="min-w-[120px] flex-1 px-4 py-2 bg-white text-amber-600 border-2 border-amber-100 rounded-xl font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Send size={24} className="shrink-0" />
              <span className="text-left leading-tight text-sm sm:text-base">ENCAMINHAR</span>
            </button>
            <button
              onClick={() => handleFinish(currentCall.id)}
              className="min-w-[120px] flex-1 px-4 py-2 bg-sefaz-accent text-white rounded-xl font-bold hover:bg-sefaz-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
            >
              <CheckCircle2 size={24} className="shrink-0" />
              <span className="text-left leading-tight text-sm sm:text-base">FINALIZAR</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
