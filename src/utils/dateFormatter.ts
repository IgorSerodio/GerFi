export function formatTime(dateStr: string | Date | null | undefined, options?: { showSeconds?: boolean }): string {
  if (!dateStr) return "--:--";
  
  const dateObj = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  
  if (isNaN(dateObj.getTime())) return "--:--";

  const opts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };

  if (options?.showSeconds) {
    opts.second = '2-digit';
  }

  return dateObj.toLocaleTimeString("pt-BR", opts);
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "--/--/----";
  
  const dateObj = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  
  if (isNaN(dateObj.getTime())) return "--/--/----";

  return dateObj.toLocaleDateString("pt-BR");
}

export function formatDateTime(dateStr: string | Date | null | undefined, options?: { showSeconds?: boolean }): string {
  if (!dateStr) return "--/--/---- --:--";
  return `${formatDate(dateStr)} ${formatTime(dateStr, options)}`;
}
