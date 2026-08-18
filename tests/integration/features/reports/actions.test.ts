import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getReportFiltersDataAction,
  getLogisticsDashboardDataAction,
  getReportsDataAction,
  getTimelineAction,
} from '@/features/reports/actions';
import { pool } from "@/infra/database";
import { issueTicketAction } from "@/features/queue/actions";
import { createCategoryAction, createLocationAction } from "@/features/management/actions";

describe("Reports Actions (Integration)", () => {
  let locationId: number;
  let categoryId: number;

  beforeAll(async () => {
    // Sincronizar locations
    await pool.query(`SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations))`);
    
    // Criar dados base
    const locResult = await createLocationAction("Local Relatório");
    locationId = locResult.data?.id as number;

    const catResult = await createCategoryAction({
      name: "Serviço Relatório",
      ticketChar: "R",
      color: "#000",
      expectedTimeNormal: 10,
      expectedTimePriority: 20
    } as Parameters<typeof createCategoryAction>[0]);
    categoryId = catResult.data?.id as number;

    // Gerar um ticket para o relatório
    await issueTicketAction({
      categoryId: categoryId,
      categoryName: "Serviço Relatório",
      priority: "Normal",
      locationId: locationId
    });
  });

  afterAll(async () => {
    // Limpeza
    await pool.query("DELETE FROM tickets WHERE category_id = $1", [categoryId]);
    await pool.query("DELETE FROM categories WHERE id = $1", [categoryId]);
    await pool.query("DELETE FROM locations WHERE id = $1", [locationId]);
    await pool.end();
  });

  it("Deve carregar os filtros de relatório", async () => {
    const result = await getReportFiltersDataAction();
    expect(result.success).toBe(true);
    expect(result.data?.locations).toBeDefined();
    expect(result.data?.users).toBeDefined();
    
    const locs = result.data?.locations;
    expect(locs?.find(l => l.id === locationId)).toBeDefined();
  });

  it("Deve carregar os dados do Dashboard Logístico (getLogisticsDashboardDataAction)", async () => {
    // Para testar a matemática real, vamos criar mais tickets manuais forçando tempos diferentes
    // Vamos usar pool.query para inserir no passado com precisão
    await pool.query(`
      INSERT INTO tickets (ticket_number, priority, status, location_id, category_id, category_name, created_at, started_at, completed_at)
      VALUES 
      ('R002', 'Normal', 'completed', $1, $2, 'Serviço Relatório', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '10 minutes'),
      ('R003', 'Prioritário',  'completed', $1, $2, 'Serviço Relatório', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '5 minutes'),
      ('R004', 'Normal', 'no_show',   $1, $2, 'Serviço Relatório', NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '40 minutes')
    `, [locationId, categoryId]);

    const result = await getLogisticsDashboardDataAction("today", "tickets", "all");
    expect(result.success).toBe(true);
    
    const { stats, chartData, categoryAggregation } = result.data!;
    expect(stats).toBeDefined();
    expect(stats.total).toBeGreaterThanOrEqual(4); // 1 do beforeAll + 3 novos

    // Validação de tempo médio de espera e atendimento
    // O retorno é uma string "X min"
    expect(stats.avgWait).toContain("min");
    expect(stats.avgService).toContain("min");
    expect(stats.efficiency).toContain("%");

    expect(chartData).toBeDefined();
    expect(categoryAggregation).toBeDefined();
  });

  it("Deve carregar os dados do Relatório Analítico (getReportsDataAction)", async () => {
    const payload = {
      reportType: "analytical" as const,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      service: "all",
      locationId: "all" as const,
      attendants: [],
      selectedModels: ["volume", "analytical"],
    };

    const result = await getReportsDataAction(payload);
    expect(result.success).toBe(true);
    expect(result.data?.detailRows).toBeDefined();
    expect(result.data?.totalDetails).toBeDefined();
    expect(result.data?.stats).toBeDefined();
  });

  it("Deve carregar a Timeline (getTimelineAction)", async () => {
    const result = await getTimelineAction("all", []);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // Mesmo vazia, a estrutura deve ser retornada sem erro
  });
});
