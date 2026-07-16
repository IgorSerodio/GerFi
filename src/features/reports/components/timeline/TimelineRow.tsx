import React from 'react';
import { TimelineTicket } from '@/features/reports/queries';
import { getTicketTooltipText } from './utils';

interface TimelineRowProps {
  attendant: string;
  matricula: string;
  guiche: string;
  tickets: TimelineTicket[];
  minTime: number;
  maxTime: number;
  activeTicketNumber: string | null;
  onTicketHover: (id: string | null) => void;
  onTicketClick: (e: React.MouseEvent, id: string) => void;
}

export default function TimelineRow({ 
  attendant, matricula, guiche, tickets, minTime, maxTime, activeTicketNumber, onTicketHover, onTicketClick 
}: TimelineRowProps) {
  const duration = maxTime - minTime;

  const getPercent = (dateStr: string) => {
    const time = new Date(dateStr).getTime();
    return ((time - minTime) / duration) * 100;
  };

  return (
    <div className="flex items-center min-h-[60px] border-b border-emerald-50 hover:bg-emerald-50/20 transition-colors group">
      {/* Coluna Esquerda: Info do Atendente */}
      <div className="w-[200px] shrink-0 pr-4 py-2 border-r border-emerald-100 flex flex-col justify-center">
        <div className="text-[10px] font-black text-sefaz-dark uppercase tracking-tight truncate" title={attendant}>
          {attendant}
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[9px] font-medium text-sefaz-accent opacity-60 truncate">
            {matricula || 'N/A'}
          </span>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">
            {guiche}
          </span>
        </div>
      </div>

      {/* Coluna Direita: Linha do Tempo */}
      <div className="flex-1 relative h-[60px] mx-2 overflow-hidden">
        {/* Linha guia de fundo opcional */}
        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-emerald-100 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />

        {tickets.map(ticket => {
          if (!ticket.calledAt) return null;

          const calledPct = getPercent(ticket.calledAt);
          const startedPct = ticket.startedAt ? getPercent(ticket.startedAt) : null;
          const completedPct = ticket.completedAt ? getPercent(ticket.completedAt) : getPercent(new Date().toISOString());

          const isPriority = ticket.priority === 'Prioritário';
          
          // Cores baseadas na prioridade
          const callingColor = isPriority ? 'bg-yellow-300' : 'bg-emerald-300';
          const processingColor = isPriority ? 'bg-yellow-500' : 'bg-emerald-500';
          
          const tooltip = getTicketTooltipText(ticket);
          
          const isActive = ticket.ticketNumber === activeTicketNumber;
          const isFaded = activeTicketNumber !== null && !isActive;
          const opacityClass = isFaded ? 'opacity-5' : 'opacity-100';
          const zIndexClass = isActive ? 'z-20' : 'z-10';
          const commonClasses = `transition-opacity duration-200 cursor-pointer ${opacityClass} ${zIndexClass}`;
          
          const events = {
            onMouseEnter: () => onTicketHover(ticket.id),
            onMouseLeave: () => onTicketHover(null),
            onClick: (e: React.MouseEvent) => onTicketClick(e, ticket.id)
          };

          return (
            <React.Fragment key={ticket.id}>
              {/* Segmento: Called -> Started (ou Completed se não tiver Started) */}
              <div 
                className={`absolute top-1/2 h-1.5 -translate-y-1/2 ${callingColor} rounded-l-full ${commonClasses}`}
                style={{ 
                  left: `${calledPct}%`, 
                  width: `${(startedPct ?? completedPct) - calledPct}%` 
                }}
                title={tooltip}
                {...events}
              />

              {/* Segmento: Started -> Completed */}
              {startedPct !== null && (
                <div 
                  className={`absolute top-1/2 h-1.5 -translate-y-1/2 ${processingColor} rounded-r-full ${commonClasses}`}
                  style={{ 
                    left: `${startedPct}%`, 
                    width: `${completedPct - startedPct}%` 
                  }}
                  title={tooltip}
                  {...events}
                />
              )}

              {/* Ponto Roxo: Chamada Inicial */}
              <div 
                className={`absolute top-1/2 w-2 h-2 bg-purple-500 rounded-full -translate-y-1/2 -translate-x-1/2 ring-[0.5px] ring-white ${commonClasses}`}
                style={{ left: `${calledPct}%` }}
                title={tooltip}
                {...events}
              />

              {/* Pontos Roxos: Rechamadas */}
              {ticket.recallHistory.map((recallTime, i) => (
                <div 
                  key={i}
                  className={`absolute top-1/2 w-2 h-2 bg-purple-500 rounded-full -translate-y-1/2 -translate-x-1/2 ring-[0.5px] ring-white ${commonClasses}`}
                  style={{ left: `${getPercent(recallTime)}%` }}
                  title={tooltip}
                  {...events}
                />
              ))}

              {/* Ponto Final: Encaminhado (Laranja) ou No Show (Vermelho) */}
              {ticket.completedAt && ticket.status === 'forwarded' && (
                <div 
                  className={`absolute top-1/2 w-2 h-2 bg-orange-500 rounded-full -translate-y-1/2 -translate-x-1/2 ring-[0.5px] ring-white ${commonClasses}`}
                  style={{ left: `${completedPct}%` }}
                  title={tooltip}
                  {...events}
                />
              )}

              {ticket.completedAt && ticket.status === 'no_show' && (
                <div 
                  className={`absolute top-1/2 w-2 h-2 bg-red-500 rounded-full -translate-y-1/2 -translate-x-1/2 ring-[0.5px] ring-white ${commonClasses}`}
                  style={{ left: `${completedPct}%` }}
                  title={tooltip}
                  {...events}
                />
              )}

            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
