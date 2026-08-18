import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { 
  issueTicketAction, 
  callTicketAction, 
  startTicketAction, 
  finishTicketAction, 
  noShowTicketAction, 
  forwardTicketAction,
  recallTicketAction
} from "../actions";
import { pool } from "@/infra/database";

describe("Queue Actions (Integration)", () => {
  let categoryId: number;
  let categoryName: string;
  const locationId = 1; // Supomos que o Local 1 (Geral) exista após as migrations

  let ticketIdMain: string;
  let ticketSecurityCodeMain: string;

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
    
    // Sincronizar a sequence do Postgres após inserção manual para não quebrar outros testes
    await pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
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
    
    ticketIdMain = result.data?.id as string;
    ticketSecurityCodeMain = result.data?.securityCode as string;
    
    // Validar se salvou no banco
    const dbTicket = await pool.query(`SELECT id, status FROM tickets WHERE id = $1`, [ticketIdMain]);
    expect(dbTicket.rows[0].status).toBe("pending");
  });

  it("Fluxo 2: Atendente chama a próxima senha disponível (callTicketAction)", async () => {
    const attendantId = 1; // Id mockado na vitest.setup.ts
    const guiche = "Guichê 1";
    const allowedServices = [categoryId];

    const result = await callTicketAction(locationId, attendantId, guiche, allowedServices, "Normal");

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.status).toBe("calling");
    expect(result.data?.attendantId).toBe(attendantId);
    expect(result.data?.guiche).toBe(guiche);
    expect(result.data?.id).toBe(ticketIdMain);
  });

  it("Fluxo 3: Atendente inicia o atendimento com código de segurança (startTicketAction)", async () => {
    // Validar com código incorreto
    const badResult = await startTicketAction(ticketIdMain, "0000");
    expect(badResult.success).toBe(false);

    // Validar com código correto
    const result = await startTicketAction(ticketIdMain, ticketSecurityCodeMain);
    expect(result.success).toBe(true);
    // startTicketAction retorna { success, error, ticket }
    expect(result.ticket?.status).toBe("started");
  });

  it("Fluxo 4: Atendente finaliza o atendimento (finishTicketAction)", async () => {
    const result = await finishTicketAction(ticketIdMain, "Problema resolvido", ["resolução A"]);
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("completed");
    expect(result.data?.observation).toBe("Problema resolvido");
  });

  it("Fluxo Alternativo: Encaminhamento (forwardTicketAction)", async () => {
    const issueRes = await issueTicketAction({ categoryId, categoryName, priority: "Normal", locationId });
    const fwTicketId = issueRes.data?.id as string;
    
    await callTicketAction(locationId, 1, "Guichê 1", [categoryId], "Normal"); // Chamada inicial

    const fwResult = await forwardTicketAction(fwTicketId, "Guichê 2", "single");
    expect(fwResult.success).toBe(true);
    
    // O forwardTicket retorna a NOVA senha inserida na fila, cujo status inicial é pending
    expect(fwResult.data?.status).toBe("pending");
    expect(fwResult.data?.forwardedTo).toBe("Guichê 2");
  });

  it("Fluxo Alternativo: Não Comparecimento (noShowTicketAction) e Rechamada", async () => {
    vi.useFakeTimers();
    
    const issueRes = await issueTicketAction({ categoryId, categoryName, priority: "Normal", locationId });
    const noShowTicketId = issueRes.data?.id as string;
    
    await callTicketAction(locationId, 1, "Guichê 1", [categoryId], "Normal"); 
    
    // Tentar rechamar imediatamente deve falhar (cooldown)
    const earlyRecall = await recallTicketAction(noShowTicketId);
    expect(earlyRecall.success).toBe(false);
    expect(earlyRecall.error).toContain("cooldown");

    // Avançar tempo em 31 segundos
    vi.advanceTimersByTime(31000);

    // Agora deve permitir rechamada
    const lateRecall = await recallTicketAction(noShowTicketId);
    expect(lateRecall.success).toBe(true);
    expect(lateRecall.data?.recallHistory?.length).toBeGreaterThan(0);

    // Marcar como não compareceu
    const noShowResult = await noShowTicketAction(noShowTicketId);
    expect(noShowResult.success).toBe(true);
    expect(noShowResult.data?.status).toBe("no_show");
    
    vi.useRealTimers();
  });
});
