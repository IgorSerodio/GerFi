import { ReportFiltersDTO } from "./base";
import { AggregatedMetricsStrategy } from "./metricsStrategies/AggregatedMetricsStrategy";
import { RawMetricsStrategy } from "./metricsStrategies/RawMetricsStrategy";

export interface VolumeStats {
  total: number;
  avgWait: string;
  avgService: string;
  efficiency: string;
}

/**
 * Obtém estatísticas gerais para um intervalo de datas
 */
export async function getVolumeStats(filters: ReportFiltersDTO): Promise<VolumeStats> {
  const strategy = (filters.subcategories && filters.subcategories.length > 0) 
    ? new RawMetricsStrategy() 
    : new AggregatedMetricsStrategy();
    
  return strategy.getVolumeStats(filters);
}
