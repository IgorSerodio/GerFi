export function getPriorityTextColorClass(priority: string, defaultColorClass: string = "text-sefaz-dark"): string {
  if (priority === "Prioritário") {
    return "text-red-600";
  }
  return defaultColorClass;
}
