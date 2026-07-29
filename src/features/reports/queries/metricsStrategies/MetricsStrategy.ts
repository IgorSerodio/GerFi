import { ReportFiltersDTO, ChartPoint, EvolutionPoint } from "../base";
import { VolumeStats } from "../volume";
import { CategoryRank, AttendantRank } from "../ranking";

export interface MetricsStrategy {
  getVolumeStats(filters: ReportFiltersDTO): Promise<VolumeStats>;
  getCategoryRanking(filters: ReportFiltersDTO): Promise<CategoryRank[]>;
  getAttendantRanking(filters: ReportFiltersDTO): Promise<AttendantRank[]>;
  getCategoryAvgDuration(filters: ReportFiltersDTO): Promise<ChartPoint[]>;
  getEvolutionSeries(filters: ReportFiltersDTO): Promise<EvolutionPoint[]>;
  getPeakHours(filters: ReportFiltersDTO): Promise<EvolutionPoint[]>;
  getBusyDays(filters: ReportFiltersDTO): Promise<ChartPoint[]>;
}
