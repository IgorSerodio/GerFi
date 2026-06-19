import React from "react";
import { Clock } from "lucide-react";
import { Ticket } from "@/features/queue/types";

interface HistorySidebarProps {
  recentTickets: Ticket[];
  duplicatedTickets: Ticket[];
  scrollDuration: number;
}

export default function HistorySidebar({
  recentTickets,
  duplicatedTickets,
  scrollDuration,
}: HistorySidebarProps) {
  return (
    <div className="w-1/3 shrink-0 flex flex-col h-full gap-8 min-h-0">
      <div className="flex-1 bg-white rounded-[60px] p-10 flex flex-col shadow-2xl border-t-[10px] border-emerald-500 relative z-20 min-h-0">
        <h2 className="text-emerald-950 font-black uppercase tracking-[0.3em] text-sm mb-12 flex items-center gap-4">
          <div className="p-2.5 bg-emerald-500 text-white rounded-2xl">
            <Clock className="h-5 w-5" />
          </div>
          Últimas Chamadas
        </h2>

        <div className="flex-1 relative overflow-hidden min-h-0 w-full mt-4">
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

          {recentTickets.length > 0 ? (
            <div
              className="animate-vertical-marquee"
              style={
                {
                  "--marquee-duration": `${scrollDuration}s`,
                } as React.CSSProperties
              }
            >
              {duplicatedTickets.map((ticket, i) => (
                <div
                  key={`hist-${ticket.id}-${i}`}
                  className="relative group shrink-0 mb-5"
                >
                  <div className="bg-emerald-50/50 hover:bg-emerald-50 p-6 rounded-[35px] flex justify-between items-center border border-emerald-100/50 transition-all hover:scale-[1.02] active:scale-100 shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="text-6xl font-black text-emerald-950 tracking-tighter leading-none">
                        {ticket.ticketNumber}
                      </div>
                      <div className="h-10 w-px bg-emerald-200" />
                      <div>
                        <div className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em] mb-1 opacity-50 block">
                          GUICHÊ
                        </div>
                        <div className="text-2xl font-black text-emerald-950 uppercase tracking-tighter">
                          #{ticket.guiche?.split(" ")[1] || "01"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[20px] font-black text-emerald-600 tabular-nums tracking-tighter">
                        {new Date(ticket.calledAt || "").toLocaleTimeString(
                          "pt-BR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-emerald-600/40 font-bold uppercase tracking-widest text-sm">
              Nenhuma chamada recente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
