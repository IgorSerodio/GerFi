import { useState } from "react";
import { getReportsDataAction, DetailRow } from "@/features/reports/actions";

export interface ReportResultData {
  stats: {
    total: number;
    avgWait: string;
    avgService: string;
    efficiency: string;
  };
  categoryAggregation: Array<{ name: string; count: number; value: number }>;
  attendantRanking: Array<{ name: string; count: number; avgDuration: number; rating: number }>;
  detailRows: DetailRow[];
  reportType: "analytical" | "synthetic";
  selectedModels: string[];
  evolutionSeries: Array<{ time: string; total: number; avg: number; wait: number }>;
  peakHours: Array<{ time: string; total: number; avg: number; wait: number }>;
  busyDays: Array<{ name: string; value: number }>;
  categoryAvgDuration: Array<{ name: string; value: number }>;
}

export function useReportsData() {
  const [reportResult, setReportResult] = useState<ReportResultData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (filters: {
    reportType: "analytical" | "synthetic";
    startDate: string;
    endDate: string;
    service: string;
    locationId: number | "all";
    attendants: string[];
    selectedModels: string[];
  }) => {
    setIsGenerating(true);
    const res = await getReportsDataAction(filters);
    if (res.success && res.data) {
      setReportResult(res.data as ReportResultData);
    } else {
      alert("Erro ao gerar relatório: " + (res.error || ""));
    }
    setIsGenerating(false);
  };

  return { reportResult, isGenerating, generateReport };
}
