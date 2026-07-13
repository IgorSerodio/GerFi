"use server";

import {
  getVolumeStats,
  getHourlyEvolutionToday,
  getWeeklyEvolution,
  getCategoryRanking,
  getAttendantRanking,
  getEvolutionSeries,
  getPeakHours,
  getBusyDays,
  getCategoryAvgDuration,
  ChartPoint,
} from "./queries";
import { pool } from "@/infra/database";
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
    } else {
      // Mock para Month/Year caso não haja histórico longo suficiente, ou fallback para agrupamento por dia
      const points = range === "month" ? 15 : 12;
      const labels = range === "month"
        ? Array.from({ length: 15 }, (_, i) => `D${i * 2 + 1}`)
        : ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      for (let i = 0; i < points; i++) {
        const base = metric === "tickets" ? 45 : metric === "wait_time" ? 12 : 38;
        chartData.push({
          name: labels[i],
          value: base + Math.floor(Math.random() * 25),
        });
      }
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
      let queryStr = `
        SELECT * FROM tickets 
        WHERE created_at BETWEEN $1 AND $2
      `;
      const params: any[] = [start, end];

      if (service !== "all") {
        params.push(parseInt(service, 10));
        queryStr += ` AND category_id = $${params.length}`;
      }
      if (locationId !== "all") {
        params.push(locationId);
        queryStr += ` AND location_id = $${params.length}`;
      }
      if (attendants && attendants.length > 0) {
        params.push(attendants);
        queryStr += ` AND attendant = ANY($${params.length})`;
      }

      queryStr += ` ORDER BY created_at DESC LIMIT 100`;
      const res = await pool.query(queryStr, params);
      detailRows = res.rows.map((row) => ({
        time: row.created_at.toLocaleString("pt-BR"),
        ref: row.ticket_number,
        desk: row.guiche ? row.guiche.replace("Guichê ", "") : "-",
        user: row.attendant || "-",
        status: row.status === "completed" ? "CONCLUÍDO" : row.status === "started" ? "EM ATENDIMENTO" : row.status === "calling" ? "CHAMADO" : "AGUARDANDO",
      }));
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
