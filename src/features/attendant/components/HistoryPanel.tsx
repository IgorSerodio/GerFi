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
      <div className="space-y-4">
        {personalHistory.map((h) => (
          <button
            key={h.id}
            onClick={() => setSelectedHistoryTicket(h)}
            className="w-full text-left flex justify-between items-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50 hover:border-emerald-200 hover:bg-emerald-100/30 transition-all group cursor-pointer"
          >
            <div>
              <p className={`font-black text-lg transition-colors ${getPriorityTextColorClass(h.priority, "text-sefaz-accent group-hover:text-sefaz-dark")}`}>
                {h.ticketNumber}
              </p>
              <p className="text-[10px] text-sefaz-accent/40 font-bold uppercase tracking-widest">
                {formatTime(h.calledAt)}
              </p>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Ver Detalhes
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
