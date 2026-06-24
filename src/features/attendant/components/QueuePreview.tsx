import React from "react";
import { Ticket } from "@/features/queue/types";

interface QueuePreviewProps {
  availableTickets: Ticket[];
}

export default function QueuePreview({ availableTickets }: QueuePreviewProps) {
  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-emerald-100 p-10">
      <h4 className="text-xl font-black text-sefaz-dark mb-6 tracking-tighter uppercase">
        Minha Fila de Espera
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {availableTickets.slice(0, 8).map((t) => (
          <div
            key={t.id}
            className={`p-6 rounded-2xl border-2 text-center transition-colors ${
              t.priority === "Prioritário"
                ? "border-emerald-200 bg-emerald-50"
                : "border-emerald-50 bg-white"
            }`}
          >
            <p
              className={`text-2xl font-black ${
                t.priority === "Prioritário"
                  ? "text-emerald-700"
                  : "text-sefaz-accent"
              }`}
            >
              {t.ticketNumber}
            </p>
            <p className="text-[10px] font-bold text-sefaz-accent/50 uppercase tracking-widest">
              {t.priority === "Prioritário" ? "Prioridade" : "Normal"}
            </p>
          </div>
        ))}
        {availableTickets.length === 0 && (
          <div className="col-span-4 py-12 text-center text-emerald-200 font-medium italic">
            Sem tickets compatíveis aguardando...
          </div>
        )}
      </div>
    </div>
  );
}
