import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ReportResultData } from "../../hooks/useReportsData";
import { ADVANCED_REPORTS } from "../../components/ReportsFilterSidebar";

export interface ReportFiltersDisplay {
  periodo: string;
  local: string;
  servico: string;
  atendentes: string;
}

export function drawHeader(doc: jsPDF, reportType: string, filters: ReportFiltersDisplay): number {
  doc.setFontSize(20);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.setFont("helvetica", "bold");
  doc.text("Relatório GerFi", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleString("pt-BR");
  doc.text(`Gerado em: ${dateStr}`, 14, 28);

  const typeLabel = reportType === "analytical" ? "Analítico" : reportType === "synthetic" ? "Sintético" : "Desempenho";
  doc.text(`Tipo: ${typeLabel}`, 14, 34);

  // Filters Block (Right aligned)
  const filtersX = 120;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Filtros Aplicados:", filtersX, 22);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Período: ${filters.periodo}`, filtersX, 28);
  doc.text(`Local: ${filters.local}`, filtersX, 34);
  doc.text(`Serviço: ${filters.servico}`, filtersX, 40);

  let attText = `Atendentes: ${filters.atendentes}`;
  if (attText.length > 50) {
    attText = attText.substring(0, 47) + "...";
  }
  doc.text(attText, filtersX, 46);

  return 55; // Returns the new currentY
}

export function drawKpis(doc: jsPDF, stats: ReportResultData["stats"], startY: number): number {
  let currentY = startY;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral", 14, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Tickets: ${stats.total}`, 14, currentY);
  currentY += 6;
  doc.text(`Eficiência: ${stats.efficiency}`, 14, currentY);
  currentY += 6;
  doc.text(`Tempo Médio de Espera: ${stats.avgWait}`, 14, currentY);
  currentY += 6;
  doc.text(`Tempo Médio de Atendimento: ${stats.avgService}`, 14, currentY);

  return currentY + 15;
}

export function drawCharts(doc: jsPDF, selectedModels: string[], chartImages: Record<string, string>, startY: number): number {
  let currentY = startY;
  const pageWidth = doc.internal.pageSize.width;

  if (selectedModels && selectedModels.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Gráficos Analíticos", 14, currentY);
    currentY += 10;

    for (const modelId of selectedModels) {
      const imgData = chartImages[modelId];
      if (!imgData) continue;

      const modelInfo = ADVANCED_REPORTS.find(r => r.id === modelId);

      if (currentY + 80 > doc.internal.pageSize.height) {
        doc.addPage();
        currentY = 20;
      }

      if (modelInfo) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(modelInfo.label.toUpperCase(), 14, currentY);
        currentY += 5;
      }

      const imgWidth = pageWidth - 28;
      const imgHeight = imgWidth * 0.5;

      doc.addImage(imgData, "PNG", 14, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 15;
    }
  }

  return currentY;
}

export function drawTable(
  doc: jsPDF,
  title: string,
  head: string[][],
  body: string[][],
  startY: number
): number {
  let currentY = startY;

  if (currentY + 20 > doc.internal.pageSize.height) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, currentY);
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  // autoTable updates doc.lastAutoTable internally, but typescript might complain,
  // we can just return a safe estimation or cast
  return (doc as any).lastAutoTable.finalY + 15;
}
