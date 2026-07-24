export function getDiffInMs(startStr: string | Date | number, endStr: string | Date | number): number {
  const start = typeof startStr === 'number' ? startStr : new Date(startStr).getTime();
  const end = typeof endStr === 'number' ? endStr : new Date(endStr).getTime();
  return Math.max(0, end - start);
}

export function getDiffInMinutes(startStr: string | Date | number, endStr: string | Date | number): number {
  const diffMs = getDiffInMs(startStr, endStr);
  return Math.round(diffMs / 60000);
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
