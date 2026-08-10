"use server";

import {
  getVolumeStats,
  getHourlyEvolutionToday,
  getWeeklyEvolution,
  getMonthlyEvolution,
  getYearlyEvolution,
  getCategoryRanking,
  getAttendantRanking,
  getEvolutionSeries,
  getPeakHours,
  getBusyDays,
  getCategoryAvgDuration,
  getTimelineData,
  getAnalyticalData,
  getPerformanceData,
  PerformanceRow,
  ChartPoint,
} from "./queries";
import { getLocations } from "@/features/management/queries";
import { getUsers } from "@/features/users/queries";
import { requirePermission } from "@/features/auth/actions";
import { UserRole } from "@/features/users/types";

export interface DetailRow {
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  originalCreatedAt: string;
  originalStartedAt: string | null;
  originalCompletedAt: string | null;
  isForwarded: boolean;
  ticketNumber: string;
  desk: string | null;
  user: string | null;
  status: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function getReportFiltersDataAction() {
  try {
    await requirePermission("ACCESS_MANAGEMENT");
    const [locations, allUsers] = await Promise.all([getLocations(), getUsers()]);
    const users = allUsers.filter(u => u.role !== UserRole.Admin);
    return { success: true, data: { locations, users } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao carregar filtros.") };
  }
}

export async function getLogisticsDashboardDataAction(
  range: "today" | "week" | "month" | "year" | "custom",
  metric: "tickets" | "wait_time" | "atendimentos",
  locationId: number | "all" = "all",
  attendants: string[] = [],
  dateStr?: string
) {
  try {
    await requirePermission("ACCESS_MANAGEMENT");
    const startDate = new Date();
    const endDate = new Date();

    if (range === "custom" && dateStr) {
      startDate.setTime(new Date(`${dateStr}T00:00:00`).getTime());
      endDate.setTime(new Date(`${dateStr}T23:59:59.999`).getTime());
    } else if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "week") {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "month") {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const filters = {
      startDate,
      endDate,
      locationId,
      attendants
    };

    const [stats, categoryAggregation, attendantRanking] = await Promise.all([
      getVolumeStats(filters),
      getCategoryRanking(filters),
      getAttendantRanking(filters),
    ]);

    let chartData: ChartPoint[] = [];

    if (range === "today") {
      chartData = await getHourlyEvolutionToday(metric, locationId, attendants);
    } else if (range === "week") {
      chartData = await getWeeklyEvolution(metric, locationId, attendants);
    } else if (range === "month") {
      chartData = await getMonthlyEvolution(metric, locationId, attendants);
    } else {
      chartData = await getYearlyEvolution(metric, locationId, attendants);
    }

    return {
      success: true,
      data: {
        stats,
        chartData,
        categoryAggregation,
        attendantRanking,
      },
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao carregar métricas.") };
  }
}

export async function getReportsDataAction(payload: {
  reportType: "analytical" | "synthetic" | "performance";
  startDate: string;
  endDate: string;
  service: string;
  locationId: number | "all";
  attendants: string[];
  subcategories?: string[];
  selectedModels: string[];
  page?: number;
  limit?: number;
}) {
  try {
    await requirePermission("ACCESS_MANAGEMENT");
    const { reportType, startDate, endDate, service, locationId, attendants, subcategories, selectedModels, page = 1, limit = 50 } = payload;

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    let end: Date | null = null;
    if (endDate) {
      end = new Date(`${endDate}T23:59:59.999`);
    }

    const filters = {
      startDate: start,
      endDate: end,
      service,
      locationId,
      attendants,
      subcategories
    };

    const stats = await getVolumeStats(filters);
    const categoryAggregation = await getCategoryRanking(filters);
    const attendantRanking = await getAttendantRanking(filters);
    const evolutionSeries = await getEvolutionSeries(filters);
    const peakHours = await getPeakHours(filters);
    const busyDays = await getBusyDays(filters);
    const categoryAvgDuration = await getCategoryAvgDuration(filters);

    let detailRows: DetailRow[] = [];
    let totalDetails = 0;
    if (reportType === "analytical") {
      const result = await getAnalyticalData(filters, page, limit);
      totalDetails = result.total;
      detailRows = result.data.map((row) => {
        const isForwarded = row.createdAt.getTime() > row.originalCreatedAt.getTime();
        return {
          createdAt: row.createdAt.toISOString(),
          startedAt: row.startedAt ? row.startedAt.toISOString() : null,
          completedAt: row.completedAt ? row.completedAt.toISOString() : null,
          originalCreatedAt: row.originalCreatedAt.toISOString(),
          originalStartedAt: row.originalStartedAt ? row.originalStartedAt.toISOString() : null,
          originalCompletedAt: row.originalCompletedAt ? row.originalCompletedAt.toISOString() : null,
          isForwarded,
          ticketNumber: row.ticketNumber,
          desk: row.guiche || null,
          user: row.attendant || null,
          status: row.status,
        };
      });
    }

    let performanceRows: PerformanceRow[] = [];
    if (reportType === "performance") {
      performanceRows = await getPerformanceData(filters);
    }

    return {
      success: true,
      data: {
        stats,
        categoryAggregation,
        attendantRanking,
        detailRows,
        totalDetails,
        performanceRows,
        reportType,
        selectedModels,
        evolutionSeries,
        peakHours,
        busyDays,
        categoryAvgDuration,
      },
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao gerar relatório.") };
  }
}

export async function getTimelineAction(locationId: number | "all", attendants: string[], dateStr?: string) {
  try {
    await requirePermission("ACCESS_MANAGEMENT");
    
    const targetDate = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
    
    const filters = {
      startDate: targetDate,
      endDate: targetDate,
      locationId,
      attendants
    };
    
    const data = await getTimelineData(filters);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao carregar dados da linha do tempo.") };
  }
}
