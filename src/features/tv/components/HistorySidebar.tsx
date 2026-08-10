import React from "react";
import { Clock } from "lucide-react";
import { Ticket } from "@/features/queue/types";
import { formatTime } from "@/utils/dateFormatter";

interface HistorySidebarProps {
  recentTickets: Ticket[];
  duplicatedTickets: Ticket[];
  scrollDuration: number;
  ticketWindows?: { name: string; alias?: string | null; label?: string | null }[];
}

export default function HistorySidebar({
  recentTickets,
  duplicatedTickets,
  scrollDuration,
  ticketWindows,
}: HistorySidebarProps) {
  return (
    <div className="w-1/3 shrink-0 flex flex-col h-full gap-[2vw] min-h-0">
      <div className="flex-1 bg-white rounded-[3vw] p-[2vw] flex flex-col shadow-2xl border-t-[1vh] border-emerald-500 relative z-20 min-h-0">
        <h2 className="text-emerald-950 font-black uppercase tracking-[0.3em] text-[2.5vh] mb-[3vh] flex items-center gap-[1vw]">
          <div className="p-[0.5vw] bg-emerald-500 text-white rounded-[1vw]">
            <Clock className="h-[3.5vh] w-[3.5vh]" />
          </div>
          Últimas Chamadas
        </h2>

        <div className="flex-1 relative overflow-hidden min-h-0 w-full mt-4">
          <div className="absolute top-0 left-0 right-0 h-[4vh] bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[4vh] bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

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
                <div key={`${ticket.id}-${i}`} className="shrink-0 mb-[2vh]">
                  {(() => {
                    const currentWindow = ticketWindows?.find(w => w.name === ticket.guiche);
                    const displayGuiche = ticket.guicheAlias || ticket.guiche || "";
                    const isGuiche = displayGuiche.toLowerCase().includes("guichê");
                    const guicheLabel = currentWindow?.label || (isGuiche ? "GUICHÊ" : "LOCAL");
                    
                    const displayValue = isGuiche 
                      ? (displayGuiche.split(" ")[1] || "01")
                      : displayGuiche;
                      
                    const charCount = displayValue.length;
                    const fontSizeVh = charCount <= 3 
                      ? 2.5 
                      : Math.max(1.2, 2.5 - (charCount - 3) * 0.12);

                    return (
                      <div className="bg-emerald-50/50 hover:bg-emerald-50 p-[1.5vw] rounded-[2vw] flex justify-between items-center border border-emerald-100/50 transition-all hover:scale-[1.02] active:scale-100 shadow-sm gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`text-[4vh] md:text-[5vh] font-black tracking-tighter leading-none shrink-0 min-w-[8vw] xl:min-w-[10vw] ${ticket.priority === "Prioritário" ? "text-red-600" : "text-emerald-950"}`}>
                            {ticket.ticketNumber}
                          </div>
                          <div className="h-[5vh] w-px bg-emerald-200 mx-1 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[1.2vh] text-emerald-600 font-black uppercase tracking-[0.2em] mb-[0.5vh] opacity-50 truncate">
                              {guicheLabel}
                            </div>
                            <div 
                              className="font-black text-emerald-950 uppercase tracking-tighter truncate" 
                              style={{ fontSize: `${fontSizeVh}vh` }}
                              title={displayGuiche}
                            >
                              {displayValue}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[2.2vh] font-black text-emerald-600 tabular-nums tracking-tighter">
                            {formatTime(ticket.calledAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
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
