import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { registerUserAction, requestPasswordResetAction, resetPasswordWithPinAction } from '@/features/auth/actions';
import { pool } from "@/infra/database";

// Mock para simular o envio de e-mail e não tentar bater num servidor SMTP real
vi.mock("../email", () => ({
  sendPasswordRecoveryEmail: vi.fn().mockResolvedValue(true),
}));

describe("Auth Actions (Integration)", () => {
  const testEmail = "test_auth@gerfi.com";
  let createdUserId: number;

  afterAll(async () => {
    // Limpar usuário de teste do banco
    if (createdUserId) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [createdUserId]);
    }
    await pool.end();
  });

  it("Deve bloquear a criação de usuário com papel 'Admin' e retornar erro", async () => {
    const payload = {
      name: "Fake Admin",
      username: "fakeadmin",
      email: "fake@gerfi.com",
      password: "123",
      role: "Admin" as any,
      matricula: "000001",
      cpf: "11111111111",
      canCallNormal: true,
      canCallPriority: true,
    };

    const result = await registerUserAction(payload);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain("Admin não é permitido");
  });

  it("Deve registrar com sucesso um usuário com papel 'Atendente' e bloqueá-lo automaticamente", async () => {
    const payload = {
      name: "Atendente Auth Test",
      username: "att_auth_test",
      email: testEmail,
      password: "123",
      role: "Atendente" as any,
      matricula: "000002",
      cpf: "22222222222",
      canCallNormal: true,
      canCallPriority: false,
    };

    const result = await registerUserAction(payload);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    createdUserId = result.data?.id as number;
    expect(createdUserId).toBeGreaterThan(0);

    // Validar se o usuário foi criado bloqueado no BD
    const dbUser = await pool.query(`SELECT blocked FROM users WHERE id = $1`, [createdUserId]);
    expect(dbUser.rows[0].blocked).toBe(true);
  });

  it("Deve gerar um PIN de recuperação de senha válido", async () => {
    // Desbloquear o usuário para permitir a recuperação de senha
    await pool.query(`UPDATE users SET blocked = false WHERE id = $1`, [createdUserId]);

    // requestPasswordResetAction simula atraso de 1.5s se bloqueado
    const result = await requestPasswordResetAction(testEmail);
    
    expect(result.success).toBe(true);
    expect(result.message).toContain("enviado");

    // Verificar se o PIN foi salvo no BD
    const dbUser = await pool.query(`SELECT reset_pin, reset_pin_expires FROM users WHERE id = $1`, [createdUserId]);
    expect(dbUser.rows[0].reset_pin).toHaveLength(6);
    expect(new Date(dbUser.rows[0].reset_pin_expires).getTime()).toBeGreaterThan(Date.now());
  });

  it("Deve redefinir a senha com sucesso quando fornecido o PIN correto", async () => {
    // 1. Pegar o PIN diretamente do banco
    const dbUser = await pool.query(`SELECT reset_pin FROM users WHERE id = $1`, [createdUserId]);
    const pin = dbUser.rows[0].reset_pin;

    // 2. Usar o PIN para resetar
    const newPassword = "new_secure_password";
    const result = await resetPasswordWithPinAction(testEmail, pin, newPassword);
    
    expect(result.success).toBe(true);

    // 3. Validar se o PIN foi apagado do BD após o uso
    const checkDb = await pool.query(`SELECT reset_pin, reset_pin_expires FROM users WHERE id = $1`, [createdUserId]);
    expect(checkDb.rows[0].reset_pin).toBeNull();
    expect(checkDb.rows[0].reset_pin_expires).toBeNull();
  });
});
