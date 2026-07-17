import { TimelineTicket } from '@/features/reports/queries';
import { getTicketStatusLabel } from '@/utils/ticketStatus';
import { formatTime } from '@/utils/dateFormatter';
import { getDiffInMinutes } from '@/utils/timeUtils';

export function getTicketTooltipText(ticket: TimelineTicket): string {


  const arrived = formatTime(ticket.createdAt);
  const called = formatTime(ticket.calledAt);
  const waitTime = ticket.calledAt ? getDiffInMinutes(ticket.createdAt, ticket.calledAt) : 0;
  
  let durationVal = 0;
  let durationStr = 'Em andamento';
  if (ticket.completedAt && ticket.startedAt) {
    durationVal = getDiffInMinutes(ticket.startedAt, ticket.completedAt);
    durationStr = `${durationVal}`;
  } else if (ticket.completedAt && ticket.calledAt) {
    durationVal = getDiffInMinutes(ticket.calledAt, ticket.completedAt);
    durationStr = `${durationVal}`;
  }

  const isForwarded = ticket.originalCreatedAt && new Date(ticket.createdAt).getTime() > new Date(ticket.originalCreatedAt).getTime();
  
  let header = `Ticket: ${ticket.ticketNumber}`;
  let arrivedText = `Criado: ${arrived}`;
  let calledText = `Chamado: ${called}`;
  let waitText = `Esperou: ${waitTime} min`;
  let durationFinalText = durationStr === 'Em andamento' ? `Duração: ${durationStr}` : `Duração: ${durationStr} min`;

  if (isForwarded) {
    header = `Ticket: Encaminhamento de ${ticket.ticketNumber}`;
    const origArrived = formatTime(ticket.originalCreatedAt);
    const origCalled = formatTime(ticket.originalCalledAt);
    const globalWait = Math.round((ticket.globalWaitSeconds || 0) / 60);
    const globalService = Math.round((ticket.globalServiceSeconds || 0) / 60);
    
    arrivedText = `Criado: ${arrived} (original - ${origArrived})`;
    calledText = `Chamado: ${called} (original - ${origCalled})`;
    waitText = `Esperou: ${waitTime} min (total - ${globalWait} min)`;
    
    if (durationStr !== 'Em andamento') {
      durationFinalText = `Duração: ${durationStr} min (total - ${globalService} min)`;
    } else {
      durationFinalText = `Duração: ${durationStr} (total até agora - ${globalService} min)`;
    }
  } else if (ticket.status === 'forwarded') {
    const globalWait = Math.round((ticket.globalWaitSeconds || 0) / 60);
    const globalService = Math.round((ticket.globalServiceSeconds || 0) / 60);
    
    waitText = `Esperou: ${waitTime} min (total - ${globalWait} min)`;
    
    if (durationStr !== 'Em andamento') {
      durationFinalText = `Duração: ${durationStr} min (total - ${globalService} min)`;
    } else {
      durationFinalText = `Duração: ${durationStr} (total até agora - ${globalService} min)`;
    }
  }

  const statusDisplay = getTicketStatusLabel(ticket.status);

  return `${header}\nStatus: ${statusDisplay}\nPrioridade: ${ticket.priority}\n${arrivedText}\n${calledText}\n${waitText}\n${durationFinalText}`;
}
