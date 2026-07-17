import React, { useEffect, useState } from 'react';
import { getTimelineAction } from '@/features/reports/actions';
import { TimelineTicket } from '@/features/reports/queries';
import { User } from '@/features/users/types';
import TimelineAxis from './TimelineAxis';
import TimelineRow from './TimelineRow';
import TimelineMinimap from './TimelineMinimap';
import TimelineReceptionRow from './TimelineReceptionRow';
import { useQueueStream } from "@/features/queue/hooks/useQueueStream";


interface TimelineViewProps {
  locationId: number | "all";
  attendants: string[];
  users: User[];
  dateStr?: string;
}

interface AttendantGroup {
  name: string;
  matricula: string;
  guiche: string;
  tickets: TimelineTicket[];
}

export default function TimelineView({ locationId, attendants, users, dateStr }: TimelineViewProps) {
  const [data, setData] = useState<TimelineTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewRange, setViewRange] = useState<[number, number]>([0, 100]);
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);
  const [lockedTicketId, setLockedTicketId] = useState<string | null>(null);

  const activeId = lockedTicketId || hoveredTicketId;
  const activeTicketNumber = activeId ? data.find(t => t.id === activeId)?.ticketNumber || null : null;

  const handleTicketHover = (id: string | null) => {
    setHoveredTicketId(id);
  };

  const handleTicketClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLockedTicketId(prev => (prev === id ? null : id));
  };

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    const res = await getTimelineAction(locationId, attendants, dateStr);
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  }, [locationId, attendants, dateStr]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  useQueueStream(fetchData);

  if (isLoading && data.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-sefaz-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center text-xs font-bold text-emerald-800 uppercase tracking-widest">
        Nenhum atendimento registrado nesta data
      </div>
    );
  }

  const grouped = data.reduce((acc, ticket) => {
    if (!ticket.calledAt) return acc;
    if (!acc[ticket.attendant]) {
      const user = users.find(u => u.name === ticket.attendant);
      acc[ticket.attendant] = {
        name: ticket.attendant,
        matricula: user?.matricula || '',
        guiche: ticket.guiche,
        tickets: []
      };
    }
    acc[ticket.attendant].tickets.push(ticket);
    acc[ticket.attendant].guiche = ticket.guiche; 
    return acc;
  }, {} as Record<string, AttendantGroup>);

  const groups = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));

  let minTime = Infinity;
  let maxTime = new Date().getTime();
  
  // Se for uma data no passado, maxTime não deve ser a hora atual de hoje, 
  // mas sim o final do dia escolhido ou o último ticket
  if (dateStr && dateStr !== new Date().toISOString().split('T')[0]) {
    maxTime = new Date(`${dateStr}T23:59:59.999`).getTime();
  }

  data.forEach(ticket => {
    if (ticket.calledAt) {
      const time = new Date(ticket.calledAt).getTime();
      if (time < minTime) minTime = time;
    }
  });

  if (minTime !== Infinity) {
    minTime -= 10 * 60 * 1000;
    
    // Ajustar maxTime caso haja tickets e seja passado (evita que o final do dia fique muito longe se o atendimento acabou cedo)
    if (dateStr && dateStr !== new Date().toISOString().split('T')[0]) {
       let realMax = -Infinity;
       data.forEach(ticket => {
         if (ticket.calledAt) {
           const time = new Date(ticket.calledAt).getTime();
           if (time > realMax) realMax = time;
         }
         if (ticket.completedAt) {
           const time = new Date(ticket.completedAt).getTime();
           if (time > realMax) realMax = time;
         }
       });
       if (realMax !== -Infinity) {
          maxTime = realMax + 10 * 60 * 1000; // +10 min após o último evento
       }
    }
  } else {
    maxTime = new Date().getTime();
    minTime = maxTime - 60 * 60 * 1000;
  }

  const globalDuration = maxTime - minTime;
  const filteredMinTime = minTime + globalDuration * (viewRange[0] / 100);
  const filteredMaxTime = minTime + globalDuration * (viewRange[1] / 100);

  return (
    <div className="w-full flex flex-col">
      {/* Legendas */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50">
        <div className="text-[9px] font-black text-sefaz-accent uppercase tracking-widest mr-2">Legenda:</div>
        
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 bg-emerald-300 rounded-full" />
          <span className="text-[10px] font-bold text-sefaz-dark">Chamando (Normal)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 bg-emerald-500 rounded-full" />
          <span className="text-[10px] font-bold text-sefaz-dark">Atendimento (Normal)</span>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <div className="w-4 h-1.5 bg-yellow-300 rounded-full" />
          <span className="text-[10px] font-bold text-sefaz-dark">Chamando (Prioritário)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1.5 bg-yellow-500 rounded-full" />
          <span className="text-[10px] font-bold text-sefaz-dark">Atendimento (Prioritário)</span>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <span className="text-[10px] font-bold text-sefaz-dark">Chamada / Rechamada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full" />
          <span className="text-[10px] font-bold text-sefaz-dark">Encaminhado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-[10px] font-bold text-sefaz-dark">Ausente</span>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="text-[10px] font-bold text-sefaz-dark">Chegada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          <span className="text-[10px] font-bold text-sefaz-dark">Fila (Aguardando)</span>
        </div>
      </div>

      <TimelineMinimap 
        minTime={minTime} 
        maxTime={maxTime} 
        onChange={(start, end) => setViewRange([start, end])} 
      />

      <div className="w-full overflow-x-auto custom-scrollbar pb-4">
        <div className="min-w-[800px]" onClick={() => setLockedTicketId(null)}>
          <TimelineAxis minTime={filteredMinTime} maxTime={filteredMaxTime} />
          
          <div className="flex flex-col">
            <TimelineReceptionRow 
              tickets={data}
              minTime={filteredMinTime}
              maxTime={filteredMaxTime}
              activeTicketNumber={activeTicketNumber}
              onTicketHover={handleTicketHover}
              onTicketClick={handleTicketClick}
            />
            {groups.map(group => (
              <TimelineRow
                key={group.name}
                attendant={group.name}
                matricula={group.matricula}
                guiche={group.guiche}
                tickets={group.tickets}
                minTime={filteredMinTime}
                maxTime={filteredMaxTime}
                activeTicketNumber={activeTicketNumber}
                onTicketHover={handleTicketHover}
                onTicketClick={handleTicketClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
