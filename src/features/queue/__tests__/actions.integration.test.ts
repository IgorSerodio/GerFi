import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { issueTicketAction, callTicketAction } from "../actions";
import { pool } from "@/infra/database";

describe("Queue Actions (Integration)", () => {
  let categoryId: number;
  let categoryName: string;
  const locationId = 1; // Supomos que o Local 1 (Geral) exista após as migrations

  beforeAll(async () => {
    // 1. Garantir que temos um serviço/categoria para testar
    const { rows: categories } = await pool.query(`SELECT id, name FROM categories LIMIT 1`);
    
    if (categories.length > 0) {
      categoryId = categories[0].id;
      categoryName = categories[0].name;
    } else {
      // Se não houver, criamos um serviço de teste
      const res = await pool.query(`
        INSERT INTO categories (ticket_char, name, description, color) 
        VALUES ('T', 'Teste', 'Serviço de Teste', '#000000') RETURNING id, name
      `);
      categoryId = res.rows[0].id;
      categoryName = res.rows[0].name;
    }

    // 2. Garantir que o Local 1 exista
    await pool.query(`INSERT INTO locations (id, name) VALUES (1, 'Sede Teste') ON CONFLICT (id) DO NOTHING`);
    
    // 3. Garantir que o usuário Atendente (id=1) exista
    await pool.query(`
      INSERT INTO users (id, name, username, email, password, role, blocked, can_call_normal, can_call_priority, matricula, cpf) 
      VALUES (1, 'Admin', 'admin_test', 'admin@teste.com', '123', 'Admin', false, true, true, '123456', '12345678901') 
      ON CONFLICT (id) DO NOTHING
    `);
  });

  afterAll(async () => {
    // Limpar as senhas emitidas durante os testes
    await pool.query(`DELETE FROM tickets WHERE category_id = $1`, [categoryId]);
    await pool.end();
  });

  it("Fluxo 1: Emitir nova senha na Triagem (issueTicketAction)", async () => {
    const payload = {
      categoryId,
      categoryName,
      priority: "Normal" as const,
      locationId
    };

    const result = await issueTicketAction(payload);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.status).toBe("pending");
    expect(result.data?.priority).toBe("Normal");
    
    // Validar se salvou no banco
    const dbTicket = await pool.query(`SELECT id, status FROM tickets WHERE id = $1`, [result.data?.id]);
    expect(dbTicket.rows[0].status).toBe("pending");
  });

  it("Fluxo 2: Atendente chama a próxima senha disponível (callTicketAction)", async () => {
    const attendantId = 1; // Id mockado na vitest.setup.ts e agora inserido no BD
    const guiche = "Guichê 1";
    const allowedServices = [categoryId];

    // Chamar a senha Normal que acabamos de emitir no teste anterior
    const result = await callTicketAction(locationId, attendantId, guiche, allowedServices, "Normal");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // O status da senha chamada deve mudar para "calling"
    expect(result.data?.status).toBe("calling");
    expect(result.data?.attendantId).toBe(attendantId);
    expect(result.data?.guiche).toBe(guiche);
  });
});
