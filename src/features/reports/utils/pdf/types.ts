import jsPDF from "jspdf";
import { ReportResultData } from "../../hooks/useReportsData";
import { ReportFiltersDisplay } from "./coreLayout";

export interface ReportPdfStrategy {
  supports(reportType: string): boolean;
  generateContent(
    doc: jsPDF,
    data: ReportResultData,
    filters: ReportFiltersDisplay,
    chartImages: Record<string, string>,
    startY: number
  ): number;
}
