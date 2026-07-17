export function getTicketStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Concluído";
    case "no_show":
      return "Não Compareceu";
    case "forwarded":
      return "Encaminhado";
    case "started":
      return "Em Atendimento";
    case "calling":
      return "Chamando";
    case "pending":
      return "Aguardando";
    default:
      if (!status) return "";
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
