export function getDiffInMs(startStr: string | Date | number, endStr: string | Date | number): number {
  const start = typeof startStr === 'number' ? startStr : new Date(startStr).getTime();
  const end = typeof endStr === 'number' ? endStr : new Date(endStr).getTime();
  return Math.max(0, end - start);
}

export function getDiffInMinutes(startStr: string | Date | number, endStr: string | Date | number): number {
  const diffMs = getDiffInMs(startStr, endStr);
  return Math.round(diffMs / 60000);
}
