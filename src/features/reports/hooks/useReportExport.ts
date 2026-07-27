import { useState } from "react";
import { generateReportPdf } from "../utils/pdfGenerator";
import { captureCharts } from "../utils/captureCharts";
import { getReportsDataAction } from "@/features/reports/actions";
import { ReportResultData } from "./useReportsData";
import { DbCategory, Location } from "@/features/management/types";
import { ReportFiltersType } from "../components/ReportsFilterSidebar";

interface UseReportExportProps {
  reportResult: ReportResultData | null;
  reportType: "analytical" | "synthetic" | "performance";
  reportFilters: ReportFiltersType;
  locations: Location[];
  categories: DbCategory[];
  selectedModels: string[];
}

export function useReportExport({
  reportResult,
  reportType,
  reportFilters,
  locations,
  categories,
  selectedModels,
}: UseReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = async () => {
    if (!reportResult) return;
    
    // Construct readable filters
    const locName = reportFilters.locationId === "all" ? "Todos" : locations.find(l => l.id === reportFilters.locationId)?.name || "Todos";
    const servName = reportFilters.service === "all" ? "Todos" : categories.find(c => c.id.toString() === reportFilters.service)?.name || "Todos";
    const attNames = reportFilters.attendants.length === 0 ? "Todos" : reportFilters.attendants.join(", ");
    
    const startDateFormatted = reportFilters.startDate ? reportFilters.startDate.split('-').reverse().join('/') : '';
    const endDateFormatted = reportFilters.endDate ? reportFilters.endDate.split('-').reverse().join('/') : '';
    const periodStr = (reportFilters.startDate && reportFilters.endDate) ? `${startDateFormatted} a ${endDateFormatted}` : 
                      (reportFilters.startDate ? `A partir de ${startDateFormatted}` : 
                      (reportFilters.endDate ? `Até ${endDateFormatted}` : "Todo o período"));

    const filterDisplay = {
      periodo: periodStr,
      local: locName,
      servico: servName,
      atendentes: attNames
    };

    setIsExporting(true);
    try {
      let exportData = reportResult;
      
      // Se for relatório analítico, buscar todas as linhas para o PDF (sem limite de paginação)
      if (reportType === "analytical") {
        const fullRes = await getReportsDataAction({
          reportType,
          startDate: reportFilters.startDate,
          endDate: reportFilters.endDate,
          service: reportFilters.service,
          locationId: reportFilters.locationId,
          attendants: reportFilters.attendants,
          selectedModels,
          page: 1,
          limit: 999999, // Um limite massivo para garantir que tudo venha
        });
        
        if (fullRes.success && fullRes.data) {
          exportData = fullRes.data as ReportResultData;
        }
      }

      // Capture charts before generating PDF
      const chartImages = await captureCharts(reportResult.selectedModels || []);

      await generateReportPdf(exportData, filterDisplay, chartImages);
    } catch (err) {
      console.error("Error exporting PDF", err);
      alert("Erro ao exportar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return { exportPdf, isExporting };
}
