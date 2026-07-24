import jsPDF from "jspdf";
import { ReportPdfStrategy } from "../types";
import { ReportResultData } from "../../../hooks/useReportsData";
import { ReportFiltersDisplay, drawHeader, drawKpis, drawCharts, drawTable } from "../coreLayout";
import { formatDuration } from "@/utils/timeUtils";
import { getTicketStatusLabel } from "@/utils/ticketStatus";
import { formatDate, formatTime } from "@/utils/dateFormatter";

function mapAnalyticalData(detailRows: ReportResultData["detailRows"]): string[][] {
  if (!detailRows) return [];

  return detailRows.map(row => {
    const waitTime = row.startedAt ? 
      formatDuration(Math.floor((new Date(row.startedAt).getTime() - new Date(row.originalCreatedAt).getTime()) / 1000)) : "-";
    
    const serviceTime = (row.completedAt && row.startedAt) ? 
      formatDuration(Math.floor((new Date(row.completedAt).getTime() - new Date(row.startedAt).getTime()) / 1000)) : "-";

    return [
      `${formatDate(row.createdAt)} ${formatTime(row.createdAt)}`,
      row.ticketNumber + (row.isForwarded ? " (Enc)" : ""),
      row.desk || "-",
      row.user || "-",
      waitTime,
      serviceTime,
      getTicketStatusLabel(row.status)
    ];
  });
}

export class AnalyticalStrategy implements ReportPdfStrategy {
  supports(reportType: string): boolean {
    return reportType === "analytical";
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

    if (data.detailRows) {
      const tableBody = mapAnalyticalData(data.detailRows);
      const headers = [['Data', 'Senha', 'Guichê', 'Atendente', 'Espera', 'Atend.', 'Status']];
      currentY = drawTable(doc, "Detalhamento Analítico", headers, tableBody, currentY);
    }

    return currentY;
  }
}
