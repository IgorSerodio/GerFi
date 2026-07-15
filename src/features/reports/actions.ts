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
  getTimelineDataToday,
  getAnalyticalData,
  ChartPoint,
} from "./queries";
import { getLocations } from "@/features/queue/queries";
import { getUsers } from "@/features/users/queries";

interface DetailRow {
  time: string;
  ref: string;
  desk: string;
  user: string;
  status: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function getReportFiltersDataAction() {
  try {
    const [locations, users] = await Promise.all([getLocations(), getUsers()]);
    return { success: true, data: { locations, users } };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao carregar filtros.") };
  }
}

export async function getLogisticsDashboardDataAction(
  range: "today" | "week" | "month" | "year",
  metric: "tickets" | "wait_time" | "atendimentos",
  locationId: number | "all" = "all",
  attendants: string[] = []
) {
  try {
    const startDate = new Date();
    const endDate = new Date();

    if (range === "today") {
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

    const [stats, categoryAggregation, attendantRanking] = await Promise.all([
      getVolumeStats(startDate, endDate, locationId, attendants),
      getCategoryRanking(startDate, endDate, locationId, attendants),
      getAttendantRanking(startDate, endDate, locationId, attendants),
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
  reportType: "analytical" | "synthetic";
  startDate: string;
  endDate: string;
  service: string;
  locationId: number | "all";
  attendants: string[];
  selectedModels: string[];
}) {
  try {
    const { reportType, startDate, endDate, service, locationId, attendants, selectedModels } = payload;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const stats = await getVolumeStats(start, end, locationId, attendants);
    const categoryAggregation = await getCategoryRanking(start, end, locationId, attendants);
    const attendantRanking = await getAttendantRanking(start, end, locationId, attendants);
    const evolutionSeries = await getEvolutionSeries(start, end, service, locationId, attendants);
    const peakHours = await getPeakHours(start, end, service, locationId, attendants);
    const busyDays = await getBusyDays(start, end, service, locationId, attendants);
    const categoryAvgDuration = await getCategoryAvgDuration(start, end, locationId, attendants);

    // Busca detalhada dos tickets caso seja relatório analítico
    let detailRows: DetailRow[] = [];
    if (reportType === "analytical") {
      const rows = await getAnalyticalData(start, end, service, locationId, attendants);
      detailRows = rows.map((row) => {
        const isForwarded = row.createdAt.getTime() > row.originalCreatedAt.getTime();
        const origTime = row.originalCreatedAt.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
          let mappedStatus = "AGUARDANDO";
          switch (row.status) {
            case "completed": mappedStatus = "CONCLUÍDO"; break;
            case "no_show": mappedStatus = "NÃO COMPARECEU"; break;
            case "forwarded": mappedStatus = "ENCAMINHADO"; break;
            case "started": mappedStatus = "EM ATENDIMENTO"; break;
            case "calling": mappedStatus = "CHAMADO"; break;
            case "pending": mappedStatus = "AGUARDANDO"; break;
          }

          return {
            time: isForwarded ? `${row.createdAt.toLocaleString("pt-BR")} (Orig: ${origTime})` : row.createdAt.toLocaleString("pt-BR"),
            ref: isForwarded ? `ENCAM. DE ${row.ticketNumber}` : row.ticketNumber,
            desk: row.guiche ? row.guiche.replace("Guichê ", "") : "-",
            user: row.attendant || "-",
            status: mappedStatus,
          };
      });
    }

    return {
      success: true,
      data: {
        stats,
        categoryAggregation,
        attendantRanking,
        detailRows,
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

export async function getTimelineAction(locationId: number | "all", attendants: string[]) {
  try {
    const data = await getTimelineDataToday(locationId, attendants);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao carregar dados da linha do tempo.") };
  }
}
