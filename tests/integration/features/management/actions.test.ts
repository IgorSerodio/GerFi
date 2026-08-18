import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { 
  getCategoriesAction, 
  createCategoryAction, 
  updateCategoryAction, 
  deleteCategoryAction,
  getTicketWindowsAction,
  createNextTicketWindowAction,
  updateTicketWindowDetailsAction,
  deleteTicketWindowAction,
  createLocationAction,
  getLocationsAction,
  deleteLocationAction
} from '@/features/management/actions';
import { pool } from "@/infra/database";

describe("Management Actions (Integration)", () => {
  let createdCategoryId: number;
  let createdTicketWindowId: number;
  let createdLocationId: number;

  beforeAll(async () => {
    // Sincronizar a sequence de locations para evitar o erro "duplicate key value" na criação
    await pool.query(`SELECT setval('locations_id_seq', (SELECT MAX(id) FROM locations))`);
  });

  afterAll(async () => {
    // Cleanup de teste (se algo falhar no meio, limpamos no afterAll)
    if (createdTicketWindowId) {
      await pool.query("DELETE FROM ticket_windows WHERE id = $1", [createdTicketWindowId]);
    }
    if (createdCategoryId) {
      await pool.query("DELETE FROM categories WHERE id = $1", [createdCategoryId]);
    }
    if (createdLocationId) {
      await pool.query("DELETE FROM locations WHERE id = $1", [createdLocationId]);
    }
    await pool.end();
  });

  describe("Locations", () => {
    it("Deve criar um Local", async () => {
      const result = await createLocationAction("Local de Teste");
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      createdLocationId = result.data?.id as number;
      expect(createdLocationId).toBeGreaterThan(0);
    });

    it("Deve listar Locais", async () => {
      const result = await getLocationsAction();
      expect(result.success).toBe(true);
      
      const locations = result.data as any[];
      const found = locations.find(loc => loc.id === createdLocationId);
      expect(found).toBeDefined();
      expect(found.name).toBe("Local de Teste");
    });
  });

  describe("Categories", () => {
    it("Deve criar uma Categoria", async () => {
      const payload = {
        name: "Serviço Teste",
        ticketChar: "S",
        color: "#ff0000",
        expectedTimeNormal: 15,
        expectedTimePriority: 20,
      };

      const result = await createCategoryAction(payload as any);
      expect(result.success).toBe(true);
      
      createdCategoryId = result.data?.id as number;
      expect(createdCategoryId).toBeGreaterThan(0);
      expect(result.data?.name).toBe("Serviço Teste");
    });

    it("Deve atualizar uma Categoria", async () => {
      const result = await updateCategoryAction(createdCategoryId, { ticketChar: "X", expectedTimeNormal: 20 });
      expect(result.success).toBe(true);
      expect(result.data?.ticketChar).toBe("X");
      expect(result.data?.expectedTimeNormal).toBe(20);
    });

    it("Deve listar Categorias", async () => {
      const result = await getCategoriesAction();
      expect(result.success).toBe(true);
      
      const cats = result.data as any[];
      expect(cats.find(c => c.id === createdCategoryId)).toBeDefined();
    });
  });

  describe("Ticket Windows (Guichês)", () => {
    it("Deve criar o próximo Guichê no Local de Teste", async () => {
      const result = await createNextTicketWindowAction(createdLocationId);
      expect(result.success).toBe(true);
      
      createdTicketWindowId = result.data?.id as number;
      expect(createdTicketWindowId).toBeGreaterThan(0);
      // Como é o primeiro nesse local limpo (se for), o name gerado depende do DB
      expect(result.data?.locationId).toBe(createdLocationId);
    });

    it("Deve atualizar detalhes do Guichê (alias e label)", async () => {
      const result = await updateTicketWindowDetailsAction(createdTicketWindowId, "Mesa 1", "Atendimento Geral", "Grupo A");
      expect(result.success).toBe(true);
      expect(result.data?.alias).toBe("Mesa 1");
      expect(result.data?.label).toBe("Atendimento Geral");
      expect(result.data?.groupName).toBe("Grupo A");
    });

    it("Deve listar Guichês", async () => {
      const result = await getTicketWindowsAction(createdLocationId);
      expect(result.success).toBe(true);
      
      const windows = result.data as any[];
      expect(windows.find(w => w.id === createdTicketWindowId)).toBeDefined();
    });
  });

  describe("Cleanup", () => {
    it("Deve excluir o Guichê", async () => {
      const result = await deleteTicketWindowAction(createdTicketWindowId);
      expect(result.success).toBe(true);
      createdTicketWindowId = 0;
    });

    it("Deve excluir a Categoria", async () => {
      const result = await deleteCategoryAction(createdCategoryId);
      expect(result.success).toBe(true);
      createdCategoryId = 0;
    });

    it("Deve excluir o Local", async () => {
      const result = await deleteLocationAction(createdLocationId);
      expect(result.success).toBe(true);
      createdLocationId = 0;
    });
  });
});
