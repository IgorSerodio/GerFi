import React from "react";
import { PieChartGeneric } from "@/components/ui/charts/PieChartGeneric";
import { LineChartGeneric } from "@/components/ui/charts/LineChartGeneric";
import { AreaChartGeneric } from "@/components/ui/charts/AreaChartGeneric";
import { BarChartGeneric } from "@/components/ui/charts/BarChartGeneric";
import { DashboardData } from "@/features/reports/hooks/useLogisticsData";

type ChartType = "bar" | "line" | "area" | "pie";

interface LogisticsChartRendererProps {
  data: DashboardData | null | undefined;
  chartType: ChartType;
}

export function LogisticsChartRenderer({ data, chartType }: LogisticsChartRendererProps) {
  if (!data || data.chartData.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-800 uppercase tracking-widest">
        Nenhum dado disponível
      </div>
    );
  }

  if (chartType === "pie") {
    return (
      <PieChartGeneric 
        data={data.categoryAggregation}
        nameKey="name"
        valueKey="value"
      />
    );
  }

  if (chartType === "line") {
    return (
      <LineChartGeneric 
        data={data.chartData}
        xKey="name"
        yKey="value"
        name="Valor"
        color="#10b981"
      />
    );
  }

  if (chartType === "area") {
    return (
      <AreaChartGeneric 
        data={data.chartData}
        xKey="name"
        yKey="value"
        name="Valor"
        color="#10b981"
        id="logisticsArea"
      />
    );
  }

  return (
    <BarChartGeneric 
      data={data.chartData}
      xKey="name"
      yKey="value"
      name="Valor"
      color="#10b981"
    />
  );
}
