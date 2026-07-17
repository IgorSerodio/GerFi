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

export function getTicketStatusColorClass(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    case "no_show":
      return "bg-red-100 text-red-700";
    case "forwarded":
      return "bg-blue-100 text-blue-700";
    case "started":
      return "bg-amber-100 text-amber-700";
    case "calling":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
