import React, { useState } from 'react';
import { TimelineTicket } from '@/features/reports/queries';
import { getTicketTooltipText } from './utils';

interface TimelineReceptionRowProps {
  tickets: TimelineTicket[];
  minTime: number;
  maxTime: number;
  activeTicketNumber: string | null;
  onTicketHover: (id: string | null) => void;
  onTicketClick: (e: React.MouseEvent, id: string) => void;
}

export default function TimelineReceptionRow({ 
  tickets, minTime, maxTime, activeTicketNumber, onTicketHover, onTicketClick 
}: TimelineReceptionRowProps) {
  const duration = maxTime - minTime;

  const getPercent = (dateStr: string) => {
    const time = new Date(dateStr).getTime();
    return ((time - minTime) / duration) * 100;
  };

  return (
    <div className="flex items-center min-h-[40px] border-b-2 border-emerald-100 hover:bg-emerald-50/20 transition-colors group">
      {/* Coluna Esquerda: Label Fila de Espera */}
      <div className="w-[200px] shrink-0 pr-4 py-2 border-r border-emerald-100 flex flex-col justify-center">
        <div className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest truncate">
          Fila de Recepção
        </div>
        <div className="text-[9px] font-medium text-sefaz-accent opacity-60 mt-0.5 truncate">
          (Chegada e Espera)
        </div>
      </div>

      {/* Coluna Direita: Linha da Fila */}
      <div className="flex-1 relative h-[40px] mx-2 overflow-hidden">
        {/* Desenhando a linha vermelha ativa PRIMEIRO para ficar embaixo dos pontos */}
        {activeTicketNumber && tickets.map(ticket => {
          if (ticket.ticketNumber === activeTicketNumber && ticket.calledAt) {
            const createdPct = getPercent(ticket.createdAt);
            const calledPct = getPercent(ticket.calledAt);
            return (
              <div
                key={`line-${ticket.id}`}
                className="absolute top-1/2 h-0.5 bg-red-500 -translate-y-1/2"
                style={{ 
                  left: `${createdPct}%`, 
                  width: `${calledPct - createdPct}%` 
                }}
              />
            );
          }
          return null;
        })}

        {/* Desenhando os pontos */}
        {tickets.map(ticket => {
          if (!ticket.calledAt) return null; // Filtramos por calledAt no backend, mas por segurança
          
          const createdPct = getPercent(ticket.createdAt);
          const calledPct = getPercent(ticket.calledAt);
          
          const isActive = ticket.ticketNumber === activeTicketNumber;
          const isFaded = activeTicketNumber !== null && !isActive;
          const opacityClass = isFaded ? 'opacity-5' : 'opacity-100';
          const zIndexClass = isActive ? 'z-20' : 'z-10';
          const tooltip = getTicketTooltipText(ticket);

          return (
            <React.Fragment key={ticket.id}>
              {/* Ponto de Chegada (Azul) */}
              <div 
                className={`absolute top-1/2 w-2 h-2 bg-blue-500 rounded-full -translate-y-1/2 -translate-x-1/2 ring-[0.5px] ring-white transition-opacity duration-200 cursor-pointer ${opacityClass} ${zIndexClass}`}
                style={{ left: `${createdPct}%` }}
                title={tooltip}
                onMouseEnter={() => onTicketHover(ticket.id)}
                onMouseLeave={() => onTicketHover(null)}
                onClick={(e) => onTicketClick(e, ticket.id)}
              />
              
              {/* Ponto de Chamada (Cinza) */}
              <div 
                className={`absolute top-1/2 w-2 h-2 bg-gray-400 rounded-full -translate-y-1/2 -translate-x-1/2 ring-[0.5px] ring-white transition-opacity duration-200 cursor-pointer ${opacityClass} ${zIndexClass}`}
                style={{ left: `${calledPct}%` }}
                title={tooltip}
                onMouseEnter={() => onTicketHover(ticket.id)}
                onMouseLeave={() => onTicketHover(null)}
                onClick={(e) => onTicketClick(e, ticket.id)}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
