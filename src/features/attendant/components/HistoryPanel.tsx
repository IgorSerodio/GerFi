import React from "react";
import { Ticket } from "@/features/queue/types";
import { formatTime } from "@/utils/dateFormatter";
import { getPriorityTextColorClass } from "@/utils/priorityVisuals";

interface HistoryPanelProps {
  history: Ticket[];
  attendantName: string;
  setSelectedHistoryTicket: (ticket: Ticket) => void;
}

export default function HistoryPanel({
  history,
  attendantName,
  setSelectedHistoryTicket,
}: HistoryPanelProps) {
  const personalHistory = history
    .filter((h) => h.attendant === attendantName && h.status !== "calling")
    .slice(0, 5);

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-emerald-100 p-8 min-h-[400px]">
      <h4 className="text-xl font-black text-sefaz-dark mb-6 uppercase tracking-tight">
        Histórico Pessoal
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {personalHistory.map((h) => (
          <button
            key={h.id}
            onClick={() => setSelectedHistoryTicket(h)}
            className="w-full text-left flex flex-col justify-between items-start p-4 bg-emerald-50/50 rounded-2xl border-2 border-emerald-50 hover:border-emerald-200 hover:bg-emerald-100/30 transition-all group cursor-pointer min-h-[120px]"
          >
            <div>
              <p className={`font-black text-lg transition-colors ${getPriorityTextColorClass(h.priority, "text-sefaz-accent group-hover:text-sefaz-dark")}`}>
                {h.ticketNumber}
              </p>
              <p className="text-[10px] text-sefaz-accent/40 font-bold uppercase tracking-widest">
                {formatTime(h.calledAt)}
              </p>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-2.5 py-1.5 rounded-lg uppercase tracking-wider w-full text-center mt-2 group-hover:bg-emerald-200/50 transition-colors">
              Ver Detalhes
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
