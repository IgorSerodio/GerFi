import jsPDF from "jspdf";
import { ReportPdfStrategy } from "../types";
import { ReportResultData } from "../../../hooks/useReportsData";
import { ReportFiltersDisplay, drawHeader, drawKpis, drawCharts, drawTable } from "../coreLayout";
import { formatDuration } from "@/utils/timeUtils";

function mapPerformanceData(performanceRows: NonNullable<ReportResultData["performanceRows"]>): string[][] {
  if (!performanceRows) return [];

  return performanceRows.map(row => [
    row.attendant,
    row.ticketsAnswered.toString(),
    formatDuration(row.avgWaitSeconds),
    formatDuration(row.avgCallSeconds),
    formatDuration(row.avgServiceSeconds),
    formatDuration(row.totalAvgSeconds)
  ]);
}

export class PerformanceStrategy implements ReportPdfStrategy {
  supports(reportType: string): boolean {
    return reportType === "performance";
  }

  generateContent(
    doc: jsPDF,
    data: ReportResultData,
    filters: ReportFiltersDisplay,
    chartImages: Record<string, string>,
    startY: number
  ): number {
    let currentY = drawHeader(doc, data.reportType, filters);
    currentY = drawKpis(doc, data.stats, currentY);
    currentY = drawCharts(doc, data.selectedModels, chartImages, currentY);

    if (data.performanceRows) {
      const tableBody = mapPerformanceData(data.performanceRows);
      const headers = [['Servidor', 'Tickets', 'T.M. Espera', 'T.M. Chamada', 'T.M. Atend.', 'Tempo Total']];
      currentY = drawTable(doc, "Detalhamento de Desempenho", headers, tableBody, currentY);
    }

    return currentY;
  }
}
