"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Printer, FileText } from "lucide-react";

import { getCategoriesAction } from "@/features/management/actions";;
import { DbCategory } from "@/features/management/types";;
import { useReportFilters } from "@/features/reports/hooks/useReportFilters";
import { useReportsData } from "@/features/reports/hooks/useReportsData";
import { AreaChartGeneric } from "@/components/ui/charts/AreaChartGeneric";
import { BarChartGeneric } from "@/components/ui/charts/BarChartGeneric";
import { LineChartGeneric } from "@/components/ui/charts/LineChartGeneric";
import ReportsFilterSidebar, { ADVANCED_REPORTS } from "./ReportsFilterSidebar";
import ReportsKpiPanel from "./ReportsKpiPanel";
import AnalyticalTable from "./AnalyticalTable";

export default function ReportsView() {
  const { locations, users } = useReportFilters();
  const { reportResult, isGenerating: isGeneratingReport, generateReport } = useReportsData();
  
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [reportType, setReportType] = useState<"analytical" | "synthetic">("analytical");
  const [reportFilters, setReportFilters] = useState({
    startDate: "",
    endDate: "",
    service: "all",
    locationId: "all" as number | "all",
    attendants: [] as string[],
  });
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  useEffect(() => {
    const loadFiltersData = async () => {
      const res = await getCategoriesAction();
      if (res.success && res.data) {
        setCategories(res.data as DbCategory[]);
      }
    };
    loadFiltersData();
  }, []);

  const handleGenerateReport = async () => {
    await generateReport({
      reportType,
      startDate: reportFilters.startDate,
      endDate: reportFilters.endDate,
      service: reportFilters.service,
      locationId: reportFilters.locationId,
      attendants: reportFilters.attendants,
      selectedModels,
    });
  };

  const renderReportChart = (modelId: string) => {
    if (!reportResult) return null;

    switch (modelId) {
      case "evolution":
        return (
          <AreaChartGeneric 
            data={reportResult.evolutionSeries}
            xKey="time"
            yKey="total"
            name="Quantidade"
            color="#10b981"
            id={`chart-${modelId}`}
          />
        );
      case "peak_hours":
        return (
          <AreaChartGeneric 
            data={reportResult.peakHours}
            xKey="time"
            yKey="total"
            name="Quantidade"
            color="#10b981"
            id={`chart-${modelId}`}
          />
        );
      case "busy_days":
        return (
          <BarChartGeneric 
            data={reportResult.busyDays}
            xKey="name"
            yKey="value"
            name="Quantidade"
            color="#3b82f6"
          />
        );
      case "wait_time":
        return (
          <LineChartGeneric 
            data={reportResult.evolutionSeries}
            xKey="time"
            yKey="wait"
            name="Tempo Médio de Espera"
            color="#f59e0b"
          />
        );
      case "most_requested_services":
        return (
          <BarChartGeneric 
            data={reportResult.categoryAggregation}
            xKey="name"
            yKey="count"
            name="Quantidade"
            color="#f43f5e"
          />
        );
      case "avg_service_duration":
        return (
          <BarChartGeneric 
            data={reportResult.categoryAvgDuration}
            xKey="name"
            yKey="value"
            name="Tempo Médio"
            color="#6366f1"
          />
        );
      case "performance_ranking":
        return (
          <BarChartGeneric 
            data={reportResult.attendantRanking}
            xKey="name"
            yKey="count"
            name="Quantidade"
            color="#6366f1"
          />
        );
      default:
        return null;
    }
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
          <div className="bg-white rounded-[40px] shadow-sm border border-emerald-100 p-8 space-y-8">
            <div className="flex justify-between items-center print:hidden">
              <div>
                <h2 className="text-3xl font-black text-sefaz-dark uppercase tracking-tight">
                  Resultado da Consulta
                </h2>
                <p className="text-xs text-sefaz-accent font-bold uppercase tracking-widest opacity-60">
                  {reportResult.reportType === "analytical" ? "Analítico" : "Sintético"}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-sefaz-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all cursor-pointer flex items-center gap-2"
              >
                <Printer size={16} /> Imprimir
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
                      <div className="h-[200px] w-full">{renderReportChart(modelId)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabela Analítica */}
            {reportResult.reportType === "analytical" && (
              <AnalyticalTable rows={reportResult.detailRows} />
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
