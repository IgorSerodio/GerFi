import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createUserAction, getUsersAction, updateUserAction, deleteUserAction } from '@/features/users/actions';
import { pool } from "@/infra/database";

describe("Users Actions (Integration)", () => {
  let createdUserId: number;

  beforeAll(async () => {
    // Limpar usuário de teste se existir
    await pool.query(`DELETE FROM users WHERE email = 'test_crud@gerfi.com'`);
  });

  afterAll(async () => {
    // Limpar usuário de teste do banco
    if (createdUserId) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [createdUserId]);
    }
    await pool.end();
  });

  it("Deve criar um usuário com papel 'Atendente' com sucesso", async () => {
    const payload = {
      name: "Atendente CRUD Test",
      username: "att_crud_test",
      email: "test_crud@gerfi.com",
      password: "123",
      role: "Atendente" as any,
      matricula: "000003",
      cpf: "33333333333",
      canCallNormal: true,
      canCallPriority: false,
    };

    // Vitest mock user "Admin" tem permissão para criar
    const result = await createUserAction(payload);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    createdUserId = result.data?.id as number;
    expect(createdUserId).toBeGreaterThan(0);
  });

  it("Deve buscar os usuários e encontrar o recém criado", async () => {
    const result = await getUsersAction();
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Array);
    
    const users = result.data as any[];
    const testUser = users.find(u => u.id === createdUserId);
    expect(testUser).toBeDefined();
    expect(testUser.name).toBe("Atendente CRUD Test");
  });

  it("Deve atualizar os dados do usuário (ex: matricula)", async () => {
    const updatePayload = {
      matricula: "000004",
    };

    const result = await updateUserAction(createdUserId, updatePayload);
    
    expect(result.success).toBe(true);
    expect(result.data?.matricula).toBe("000004");
  });

  it("Deve excluir o usuário com sucesso", async () => {
    const result = await deleteUserAction(createdUserId);
    expect(result.success).toBe(true);

    // Validar no BD
    const dbUser = await pool.query(`SELECT * FROM users WHERE id = $1`, [createdUserId]);
    expect(dbUser.rows.length).toBe(0);
    
    // Para limpar corretamente a variável para o afterAll não dar erro
    createdUserId = 0;
  });
});
