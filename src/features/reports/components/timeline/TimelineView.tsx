import React, { useEffect, useState } from 'react';
import { getTimelineAction } from '@/features/reports/actions';
import { TimelineTicket } from '@/features/reports/queries';
import { User } from '@/features/users/types';
import TimelineAxis from './TimelineAxis';
import TimelineRow from './TimelineRow';
import TimelineMinimap from './TimelineMinimap';
import TimelineReceptionRow from './TimelineReceptionRow';

interface TimelineViewProps {
  locationId: number | "all";
  attendants: string[];
  users: User[];
}

interface AttendantGroup {
  name: string;
  matricula: string;
  guiche: string;
  tickets: TimelineTicket[];
}

export default function TimelineView({ locationId, attendants, users }: TimelineViewProps) {
  const [data, setData] = useState<TimelineTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewRange, setViewRange] = useState<[number, number]>([0, 100]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    const res = await getTimelineAction(locationId, attendants);
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  }, [locationId, attendants]);

  useEffect(() => {
    fetchData();

    const eventSource = new EventSource("/api/queue/stream");
    eventSource.addEventListener("update", () => {
      setTimeout(fetchData, 0);
    });

    return () => {
      eventSource.close();
    };
  }, [fetchData]);

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
        Nenhum atendimento registrado hoje
      </div>
    );
  }

  // Agrupar tickets por atendente
  const grouped = data.reduce((acc, ticket) => {
    if (!acc[ticket.attendant]) {
      const user = users.find(u => u.name === ticket.attendant);
      acc[ticket.attendant] = {
        name: ticket.attendant,
        matricula: user?.matricula || '',
        guiche: ticket.guiche, // guiche inicial
        tickets: []
      };
    }
    acc[ticket.attendant].tickets.push(ticket);
    // Atualizar o guiche para o mais recente se houver
    acc[ticket.attendant].guiche = ticket.guiche; 
    return acc;
  }, {} as Record<string, AttendantGroup>);

  const groups = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));

  // Encontrar o tempo mínimo e máximo para o eixo X
  let minTime = Infinity;
  let maxTime = new Date().getTime(); // maxTime é sempre agora

  data.forEach(ticket => {
    if (ticket.calledAt) {
      const time = new Date(ticket.calledAt).getTime();
      if (time < minTime) minTime = time;
    }
  });

  // Margem de 10 min no início
  if (minTime !== Infinity) {
    minTime -= 10 * 60 * 1000;
  } else {
    minTime = maxTime - 60 * 60 * 1000; // fallback: 1 hora atrás
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
        <div className="min-w-[800px]">
          <TimelineAxis minTime={filteredMinTime} maxTime={filteredMaxTime} />
          
          <div className="flex flex-col">
            <TimelineReceptionRow 
              tickets={data}
              minTime={filteredMinTime}
              maxTime={filteredMaxTime}
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
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
