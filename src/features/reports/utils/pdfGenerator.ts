import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import domtoimage from "dom-to-image";
import { ReportResultData } from "../hooks/useReportsData";
import { ADVANCED_REPORTS } from "../components/ReportsFilterSidebar";
import { formatDate, formatTime } from "@/utils/dateFormatter";

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "completed": return "Concluído";
    case "forwarded": return "Encaminhado";
    case "no_show": return "Não Compareceu";
    case "cancelled": return "Cancelado";
    case "calling": return "Chamando";
    case "started": return "Em Atendimento";
    case "pending": return "Aguardando";
    default: return status;
  }
}

export interface ReportFiltersDisplay {
  periodo: string;
  local: string;
  servico: string;
  atendentes: string;
}

export async function generateReportPdf(reportResult: ReportResultData, filters: ReportFiltersDisplay) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.setFont("helvetica", "bold");
  doc.text("Relatório GerFi", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleString("pt-BR");
  doc.text(`Gerado em: ${dateStr}`, 14, 28);
  
  const typeLabel = reportResult.reportType === "analytical" ? "Analítico" : reportResult.reportType === "synthetic" ? "Sintético" : "Desempenho";
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
  
  // Truncate attendants if too long
  let attText = `Atendentes: ${filters.atendentes}`;
  if (attText.length > 50) {
    attText = attText.substring(0, 47) + "...";
  }
  doc.text(attText, filtersX, 46);

  // KPIs
  let currentY = 55;
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral", 14, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de Tickets: ${reportResult.stats.total}`, 14, currentY);
  currentY += 6;
  doc.text(`Eficiência: ${reportResult.stats.efficiency}`, 14, currentY);
  currentY += 6;
  doc.text(`Tempo Médio de Espera: ${reportResult.stats.avgWait}`, 14, currentY);
  currentY += 6;
  doc.text(`Tempo Médio de Atendimento: ${reportResult.stats.avgService}`, 14, currentY);
  currentY += 15;

  // Charts
  if (reportResult.selectedModels && reportResult.selectedModels.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Gráficos Analíticos", 14, currentY);
    currentY += 10;

    for (const modelId of reportResult.selectedModels) {
      const modelInfo = ADVANCED_REPORTS.find(r => r.id === modelId);
      const chartElement = document.getElementById(`chart-${modelId}`);
      if (chartElement) {
        // Break page if chart won't fit
        if (currentY + 80 > doc.internal.pageSize.height) {
          doc.addPage();
          currentY = 20;
        }

        try {
          // Increase scale to capture high-res charts
          const scale = 2;
          const imgData = await domtoimage.toPng(chartElement, {
            bgcolor: '#ffffff',
            quality: 1,
            style: {
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: chartElement.offsetWidth + 'px',
              height: chartElement.offsetHeight + 'px'
            },
            width: chartElement.offsetWidth * scale,
            height: chartElement.offsetHeight * scale
          });

          if (modelInfo) {
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(modelInfo.label.toUpperCase(), 14, currentY);
            currentY += 5;
          }

          // Render chart image
          const imgWidth = pageWidth - 28; // 14mm margins
          const imgHeight = (chartElement.offsetHeight * imgWidth) / chartElement.offsetWidth;
          
          doc.addImage(imgData, "PNG", 14, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 15;

        } catch (e) {
          console.error("Failed to capture chart", modelId, e);
        }
      }
    }
  }

  // Tables
  if (reportResult.reportType === "analytical" && reportResult.detailRows) {
    // Break page if title won't fit
    if (currentY + 20 > doc.internal.pageSize.height) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento Analítico", 14, currentY);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Senha', 'Guichê', 'Atendente', 'Espera', 'Atend.', 'Status']],
      body: reportResult.detailRows.map(row => {
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
          getStatusLabel(row.status)
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8, cellPadding: 2 },
    });
  } else if (reportResult.reportType === "performance" && reportResult.performanceRows) {
    // Break page if title won't fit
    if (currentY + 20 > doc.internal.pageSize.height) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento de Desempenho", 14, currentY);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      head: [['Servidor', 'Tickets', 'T.M. Espera', 'T.M. Chamada', 'T.M. Atend.', 'Tempo Total']],
      body: reportResult.performanceRows.map(row => [
        row.attendant,
        row.ticketsAnswered.toString(),
        formatDuration(row.avgWaitSeconds),
        formatDuration(row.avgCallSeconds),
        formatDuration(row.avgServiceSeconds),
        formatDuration(row.totalAvgSeconds)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8, cellPadding: 2 },
    });
  }

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const compactDateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  doc.save(`relatorio-gerfi-${compactDateStr}.pdf`);
}
