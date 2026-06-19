import React from "react";
import { PhoneForwarded, Send, CheckCircle2, Users } from "lucide-react";
import { Ticket } from "@/features/queue/types";

interface ActiveCallCardProps {
  currentCall?: Ticket;
  allowedServicesCount: number;
  availableTicketsCount: number;
  handleCall: () => void;
  handleRecall: (ticketId: string) => void;
  setShowForwardModal: (show: boolean) => void;
  handleFinish: (ticketId: string) => void;
}

export default function ActiveCallCard({
  currentCall,
  allowedServicesCount,
  availableTicketsCount,
  handleCall,
  handleRecall,
  setShowForwardModal,
  handleFinish,
}: ActiveCallCardProps) {
  return (
    <div className="bg-white rounded-[40px] shadow-sm border-2 border-emerald-50 p-10 flex flex-col items-center min-h-[400px] justify-center shadow-glow">
      {currentCall ? (
        <div className="w-full text-center space-y-6 animate-fade-in">
          <div className="inline-block px-4 py-1.5 bg-emerald-50 text-sefaz-accent rounded-full font-black text-xs tracking-widest mb-4 border border-emerald-100 uppercase">
            Em Atendimento
          </div>
          <h3 className="text-[10rem] font-black leading-none text-sefaz-accent drop-shadow-sm mb-4">
            {currentCall.ticketNumber}
          </h3>
          <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
            <button
              onClick={() => handleRecall(currentCall.id)}
              className="min-w-[160px] flex-1 py-6 bg-white text-emerald-700 border-2 border-emerald-100 rounded-3xl font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <PhoneForwarded size={24} /> RECHAMAR
            </button>
            <button
              onClick={() => setShowForwardModal(true)}
              className="min-w-[160px] flex-1 py-6 bg-white text-amber-600 border-2 border-amber-100 rounded-3xl font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Send size={24} /> ENCAMINHAR
            </button>
            <button
              onClick={() => handleFinish(currentCall.id)}
              className="min-w-[160px] flex-1 py-6 bg-sefaz-accent text-white rounded-3xl font-bold hover:bg-sefaz-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"
            >
              <CheckCircle2 size={24} /> FINALIZAR
            </button>
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
              Clique no botão abaixo para chamar o próximo da fila
            </p>
            {allowedServicesCount > 0 && (
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">
                Filtrando por {allowedServicesCount} serviços selecionados
              </p>
            )}
          </div>
          <button
            onClick={handleCall}
            disabled={availableTicketsCount === 0}
            className="px-12 py-6 bg-sefaz-accent text-white rounded-3xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-950/30 disabled:grayscale disabled:opacity-50 cursor-pointer"
          >
            CHAMAR PRÓXIMO
          </button>
        </div>
      )}
    </div>
  );
}
