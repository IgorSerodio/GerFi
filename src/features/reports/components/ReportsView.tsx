"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileDown, FileText } from "lucide-react";
import { useReportFilters } from "@/features/reports/hooks/useReportFilters";
import { useReportsData } from "@/features/reports/hooks/useReportsData";
import { useReportExport } from "@/features/reports/hooks/useReportExport";
import { ReportChartRenderer } from "./ReportChartRenderer";
import ReportsFilterSidebar, { ADVANCED_REPORTS } from "./ReportsFilterSidebar";
import ReportsKpiPanel from "./ReportsKpiPanel";
import AnalyticalTable from "./AnalyticalTable";
import PerformanceTable from "./PerformanceTable";

export default function ReportsView() {
  const { locations, users, categories } = useReportFilters();
  const { reportResult, isGenerating: isGeneratingReport, generateReport } = useReportsData();

  const [reportType, setReportType] = useState<"analytical" | "synthetic" | "performance">("analytical");
  const [reportFilters, setReportFilters] = useState({
    startDate: "",
    endDate: "",
    service: "all",
    locationId: "all" as number | "all",
    attendants: [] as string[],
    subcategories: [] as string[],
  });
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 50;

  const { exportPdf, isExporting } = useReportExport({
    reportResult,
    reportType,
    reportFilters,
    locations,
    categories,
    selectedModels,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReportFilters((prev) => ({ ...prev, subcategories: [] }));
  }, [reportFilters.service]);


  const handleGenerateReport = async () => {
    setCurrentPage(1); // Reset page on new filter
    await generateReport({
      reportType,
      startDate: reportFilters.startDate,
      endDate: reportFilters.endDate,
      service: reportFilters.service,
      locationId: reportFilters.locationId,
      attendants: reportFilters.attendants,
      subcategories: reportFilters.subcategories,
      selectedModels,
      page: 1,
      limit,
    });
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    await generateReport({
      reportType,
      startDate: reportFilters.startDate,
      endDate: reportFilters.endDate,
      service: reportFilters.service,
      locationId: reportFilters.locationId,
      attendants: reportFilters.attendants,
      subcategories: reportFilters.subcategories,
      selectedModels,
      page: newPage,
      limit,
    });
  };



  return (
    <motion.div
      key="reports"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8"
    >
      <ReportsFilterSidebar
        reportType={reportType}
        setReportType={setReportType}
        reportFilters={reportFilters}
        setReportFilters={setReportFilters}
        categories={categories}
        locations={locations}
        users={users}
        selectedModels={selectedModels}
        setSelectedModels={setSelectedModels}
        isGeneratingReport={isGeneratingReport}
        onGenerateReport={handleGenerateReport}
      />

      {/* Resultado Relatório */}
      <main className="lg:col-span-8">
        {reportResult ? (
          <div id="report-content" className="bg-white rounded-[40px] shadow-sm border border-emerald-100 p-8 space-y-8">
            <div className="flex justify-between items-center print:hidden">
              <div>
                <h2 className="text-3xl font-black text-sefaz-dark uppercase tracking-tight">
                  Resultado da Consulta
                </h2>
                <p className="text-xs text-sefaz-accent font-bold uppercase tracking-widest opacity-60">
                  {reportResult.reportType === "analytical" ? "Analítico" : reportResult.reportType === "synthetic" ? "Sintético" : "Desempenho"}
                </p>
              </div>
              <button
                onClick={exportPdf}
                disabled={isExporting}
                className="px-6 py-3 bg-sefaz-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <FileDown size={16} /> 
                {isExporting ? "Gerando..." : "Exportar PDF"}
              </button>
            </div>

            {/* Stats Summary Panel */}
            <ReportsKpiPanel stats={reportResult.stats} />

            {/* Visual Analytics Section */}
            {reportResult.selectedModels.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reportResult.selectedModels.map((modelId: string) => {
                  const model = ADVANCED_REPORTS.find((r) => r.id === modelId);
                  return (
                    <div key={modelId} className="space-y-4">
                      <h4 className="text-[10px] font-black text-sefaz-accent uppercase tracking-widest">
                        {model?.label}
                      </h4>
                      <div id={`chart-${modelId}`} className="h-[200px] w-full bg-white">
                        <ReportChartRenderer modelId={modelId} reportResult={reportResult} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabela Analítica */}
            {reportResult.reportType === "analytical" && (
              <AnalyticalTable 
                rows={reportResult.detailRows} 
                currentPage={currentPage}
                totalPages={Math.ceil((reportResult.totalDetails || 1) / limit)}
                onPageChange={handlePageChange}
              />
            )}

            {/* Tabela de Desempenho */}
            {reportResult.reportType === "performance" && (
              <PerformanceTable rows={reportResult.performanceRows || []} />
            )}
          </div>
        ) : (
          <div className="bg-white/50 border-2 border-dashed border-emerald-100 rounded-[40px] h-full flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-emerald-100 mb-6 border border-emerald-50">
              <FileText size={48} />
            </div>
            <h3 className="text-xl font-black text-sefaz-dark uppercase tracking-tight mb-2">
              Nenhum Relatório Gerado
            </h3>
            <p className="text-sefaz-accent font-bold opacity-40 max-w-xs mx-auto text-xs uppercase tracking-widest leading-relaxed">
              Utilize a barra lateral para selecionar os filtros e acione o botão para gerar
              as métricas.
            </p>
          </div>
        )}
      </main>
    </motion.div>
  );
}
