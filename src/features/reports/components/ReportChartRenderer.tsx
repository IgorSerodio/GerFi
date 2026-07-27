import React from "react";
import { ReportResultData } from "@/features/reports/hooks/useReportsData";
import { AreaChartGeneric } from "@/components/ui/charts/AreaChartGeneric";
import { BarChartGeneric } from "@/components/ui/charts/BarChartGeneric";
import { LineChartGeneric } from "@/components/ui/charts/LineChartGeneric";

interface ReportChartRendererProps {
  modelId: string;
  reportResult: ReportResultData | null;
}

export function ReportChartRenderer({ modelId, reportResult }: ReportChartRendererProps) {
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
}
