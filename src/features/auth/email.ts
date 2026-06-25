import nodemailer from "nodemailer";

// Configurações do SMTP - Usará variáveis de ambiente quando conectarem de verdade
const smtpConfig = {
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Simula ou envia um email real de recuperação de senha com PIN.
 */
export async function sendPasswordRecoveryEmail(toEmail: string, pin: string) {
  const from = process.env.SMTP_FROM || '"GerFi" <noreply@gerfi.com.br>';

  const subject = "Recuperação de Senha - GerFi";
  const text = `Seu PIN para recuperação de senha é: ${pin}\n\nEste PIN expirará em 5 minutos.\nSe não foi você, apenas ignore este e-mail.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669;">Recuperação de Senha</h2>
      <p>Você solicitou a recuperação da sua senha no sistema GerFi.</p>
      <p>Seu código (PIN) de segurança é:</p>
      <div style="background-color: #f0fdf4; border: 1px solid #10b981; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #047857; margin: 20px 0;">
        ${pin}
      </div>
      <p><strong>Atenção:</strong> Este código expira em 5 minutos.</p>
      <p style="font-size: 12px; color: #6b7280; margin-top: 40px;">
        Se você não solicitou esta recuperação, ignore este e-mail.
      </p>
    </div>
  `;

  // Envio real
  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de recuperação:", error);
    // Não vamos falhar o processo por erro de email para não expor a existência do usuário,
    // mas na vida real um sistema de log de falhas seria apropriado.
  }
}
