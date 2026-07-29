import { ChartPoint, EvolutionPoint, ReportFiltersDTO } from "./base";
import { AggregatedMetricsStrategy } from "./metricsStrategies/AggregatedMetricsStrategy";
import { RawMetricsStrategy } from "./metricsStrategies/RawMetricsStrategy";

export async function getEvolutionSeries(filters: ReportFiltersDTO): Promise<EvolutionPoint[]> {
  const strategy = (filters.subcategories && filters.subcategories.length > 0) 
    ? new RawMetricsStrategy() 
    : new AggregatedMetricsStrategy();
    
  return strategy.getEvolutionSeries(filters);
}

export async function getPeakHours(filters: ReportFiltersDTO): Promise<EvolutionPoint[]> {
  const strategy = (filters.subcategories && filters.subcategories.length > 0) 
    ? new RawMetricsStrategy() 
    : new AggregatedMetricsStrategy();
    
  return strategy.getPeakHours(filters);
}

export async function getBusyDays(filters: ReportFiltersDTO): Promise<ChartPoint[]> {
  const strategy = (filters.subcategories && filters.subcategories.length > 0) 
    ? new RawMetricsStrategy() 
    : new AggregatedMetricsStrategy();
    
  return strategy.getBusyDays(filters);
}
