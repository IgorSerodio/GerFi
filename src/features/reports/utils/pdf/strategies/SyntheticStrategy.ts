import jsPDF from "jspdf";
import { ReportPdfStrategy } from "../types";
import { ReportResultData } from "../../../hooks/useReportsData";
import { ReportFiltersDisplay, drawHeader, drawKpis, drawCharts } from "../coreLayout";

export class SyntheticStrategy implements ReportPdfStrategy {
  supports(reportType: string): boolean {
    return reportType === "synthetic";
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

    // Synthetic report currently has no detailed table
    return currentY;
  }
}
