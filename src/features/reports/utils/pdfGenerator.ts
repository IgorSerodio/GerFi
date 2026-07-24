import jsPDF from "jspdf";
import { ReportResultData } from "../hooks/useReportsData";
import { ReportPdfStrategy } from "./pdf/types";
import { ReportFiltersDisplay } from "./pdf/coreLayout";
import { AnalyticalStrategy } from "./pdf/strategies/AnalyticalStrategy";
import { PerformanceStrategy } from "./pdf/strategies/PerformanceStrategy";
import { SyntheticStrategy } from "./pdf/strategies/SyntheticStrategy";

// Registry of available report strategies
const strategies: ReportPdfStrategy[] = [
  new AnalyticalStrategy(),
  new PerformanceStrategy(),
  new SyntheticStrategy()
];

/**
 * Generates the Report PDF orchestrating the exact layout using the Strategy Pattern.
 * @param reportResult The structured data for the report.
 * @param filters Display strings for applied filters.
 * @param chartImages Pre-captured base64 images of the charts.
 */
export async function generateReportPdf(
  reportResult: ReportResultData,
  filters: ReportFiltersDisplay,
  chartImages: Record<string, string> = {}
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const strategy = strategies.find(s => s.supports(reportResult.reportType));

  if (!strategy) {
    throw new Error(`Nenhuma estratégia encontrada para gerar o relatório do tipo: ${reportResult.reportType}`);
  }

  // Execute the isolated strategy
  strategy.generateContent(doc, reportResult, filters, chartImages, 55);

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const compactDateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  doc.save(`relatorio-gerfi-${compactDateStr}.pdf`);
}

