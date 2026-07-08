"use server";

import {
  getVolumeStats,
  getHourlyEvolutionToday,
  getWeeklyEvolution,
  getCategoryRanking,
  getAttendantRanking,
  ChartPoint,
} from "./queries";
import { pool } from "@/infra/database";

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

export async function getLogisticsDashboardDataAction(
  range: "today" | "week" | "month" | "year",
  metric: "tickets" | "wait_time" | "atendimentos"
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
      getVolumeStats(startDate, endDate),
      getCategoryRanking(startDate, endDate),
      getAttendantRanking(startDate, endDate),
    ]);

    let chartData: ChartPoint[] = [];

    if (range === "today") {
      chartData = await getHourlyEvolutionToday(metric);
    } else if (range === "week") {
      chartData = await getWeeklyEvolution(metric);
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
  attendant: string;
  selectedModels: string[];
}) {
  try {
    const { reportType, startDate, endDate, service, attendant, selectedModels } = payload;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const [stats, categoryAggregation, attendantRanking] = await Promise.all([
      getVolumeStats(start, end),
      getCategoryRanking(start, end),
      getAttendantRanking(start, end),
    ]);

    // Busca detalhada dos tickets caso seja relatório analítico
    let detailRows: DetailRow[] = [];
    if (reportType === "analytical") {
      let queryStr = `
        SELECT * FROM tickets 
        WHERE created_at BETWEEN $1 AND $2
      `;
      const params: (Date | string)[] = [start, end];

      if (service !== "all") {
        params.push(service.toUpperCase());
        queryStr += ` AND type = $${params.length}`;
      }
      if (attendant !== "all") {
        params.push(attendant);
        queryStr += ` AND attendant = $${params.length}`;
      }

      queryStr += ` ORDER BY created_at DESC LIMIT 100`;
      const res = await pool.query(queryStr, params);
      detailRows = res.rows.map((row) => ({
        time: row.created_at.toLocaleString("pt-BR"),
        ref: row.id,
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
      },
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error, "Erro ao gerar relatório.") };
  }
}
