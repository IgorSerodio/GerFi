import { useState, useCallback, useEffect } from "react";
import { getLogisticsDashboardDataAction } from "@/features/reports/actions";
import { useQueueStream } from "@/hooks/useQueueStream";

export type MetricType = "tickets" | "wait_time" | "atendimentos";
export type DateRange = "today" | "week" | "month" | "year" | "custom";

export interface DashboardData {
  stats: {
    total: number;
    avgWait: string;
    avgService: string;
    efficiency: string;
  };
  chartData: Array<{ name: string; value: number }>;
  categoryAggregation: Array<{ name: string; count: number; value: number }>;
  attendantRanking: Array<{ name: string; count: number; avgDuration: number; rating: number }>;
}

export function useLogisticsData(
  range: DateRange,
  metric: MetricType,
  locationId: number | "all",
  attendants: string[],
  activeView: "charts" | "timeline",
  timelineDate: string
) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const effectiveRange = activeView === "timeline" ? "custom" : range;
    const effectiveDateStr = activeView === "timeline" ? timelineDate : undefined;

    const res = await getLogisticsDashboardDataAction(
      effectiveRange,
      metric,
      locationId,
      attendants,
      effectiveDateStr
    );

    if (res.success && res.data) {
      setData(res.data as DashboardData);
    }
    setIsLoading(false);
  }, [range, metric, locationId, attendants, activeView, timelineDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  useQueueStream(fetchData);

  return { data, isLoading, refetch: fetchData };
}
