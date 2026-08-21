import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendPasswordRecoveryEmail } from "@/features/auth/email";
import nodemailer from "nodemailer";

// Mock do nodemailer
vi.mock("nodemailer", () => {
  const sendMailMock = vi.fn().mockResolvedValue(true);
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: sendMailMock,
      }),
    },
  };
});

describe("Email Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("Deve criar o transporter com as variáveis de ambiente corretas e chamar sendMail", async () => {
    // Configura variáveis de ambiente mockadas para o teste
    process.env.SMTP_HOST = "smtp.fake.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "fake@test.com";
    process.env.SMTP_PASS = "fakepassword";
    process.env.SMTP_FROM = '"GerFi Test" <test@gerfi.com>';

    const testEmail = "user@test.com";
    const testPin = "123456";

    await sendPasswordRecoveryEmail(testEmail, testPin);

    // Verifica se createTransport foi chamado corretamente pelo getTransporter()
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.fake.com",
      port: 465,
      secure: true,
      auth: {
        user: "fake@test.com",
        pass: "fakepassword",
      },
    });

    // Pega a instância do transporter mockado
    const mockTransporter = vi.mocked(nodemailer.createTransport).mock.results[0].value;

    // Verifica se o sendMail foi chamado com os parâmetros corretos
    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    
    const sendMailArgs = mockTransporter.sendMail.mock.calls[0][0];
    expect(sendMailArgs.from).toBe('"GerFi Test" <test@gerfi.com>');
    expect(sendMailArgs.to).toBe(testEmail);
    expect(sendMailArgs.subject).toBe("Recuperação de Senha - GerFi");
    expect(sendMailArgs.text).toContain(testPin);
    expect(sendMailArgs.html).toContain(testPin);
  });
});
