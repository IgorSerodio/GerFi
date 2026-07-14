import { TimelineTicket } from '@/features/reports/queries';

export function getTicketTooltipText(ticket: TimelineTicket): string {
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDiffMinutes = (startStr: string, endStr: string) => {
    const diffMs = new Date(endStr).getTime() - new Date(startStr).getTime();
    return Math.max(0, Math.round(diffMs / 60000));
  };

  const arrived = formatTime(ticket.createdAt);
  const called = formatTime(ticket.calledAt);
  const waitTime = ticket.calledAt ? getDiffMinutes(ticket.createdAt, ticket.calledAt) : 0;
  
  let durationStr = 'Em andamento';
  if (ticket.completedAt && ticket.startedAt) {
    durationStr = `${getDiffMinutes(ticket.startedAt, ticket.completedAt)} min`;
  } else if (ticket.completedAt && ticket.calledAt) {
    durationStr = `${getDiffMinutes(ticket.calledAt, ticket.completedAt)} min`;
  }

  return `Ticket: ${ticket.ticketNumber}
Prioridade: ${ticket.priority}
Criado: ${arrived} | Esperou: ${waitTime} min
Chamado: ${called} | Duração: ${durationStr}`;
}
