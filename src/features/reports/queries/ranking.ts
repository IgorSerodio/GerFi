import { ChartPoint, ReportFiltersDTO } from "./base";
import { AggregatedMetricsStrategy } from "./metricsStrategies/AggregatedMetricsStrategy";
import { RawMetricsStrategy } from "./metricsStrategies/RawMetricsStrategy";

export interface CategoryRank {
  name: string;
  value: number; // percentage
  count: number;
}

export interface AttendantRank {
  name: string;
  count: number;
  avgDuration: number;
  rating: number;
}

/**
 * Obtém o ranking de serviços mais procurados no período
 */
export async function getCategoryRanking(filters: ReportFiltersDTO): Promise<CategoryRank[]> {
  const strategy = (filters.subcategories && filters.subcategories.length > 0) 
    ? new RawMetricsStrategy() 
    : new AggregatedMetricsStrategy();
    
  return strategy.getCategoryRanking(filters);
}

/**
 * Obtém produtividade dos atendentes no período
 */
export async function getAttendantRanking(filters: ReportFiltersDTO): Promise<AttendantRank[]> {
  const strategy = (filters.subcategories && filters.subcategories.length > 0) 
    ? new RawMetricsStrategy() 
    : new AggregatedMetricsStrategy();
    
  return strategy.getAttendantRanking(filters);
}

export async function getCategoryAvgDuration(filters: ReportFiltersDTO): Promise<ChartPoint[]> {
  const strategy = (filters.subcategories && filters.subcategories.length > 0) 
    ? new RawMetricsStrategy() 
    : new AggregatedMetricsStrategy();
    
  return strategy.getCategoryAvgDuration(filters);
}
