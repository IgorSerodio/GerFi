/**
 * Representa um erro controlado pela aplicação, cuja mensagem é segura para ser exibida na interface do usuário.
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Trata o erro e retorna uma mensagem segura para o frontend.
 * - Se for um AppError (erro esperado), retorna a mensagem contida no erro.
 * - Caso contrário (exceções técnicas, banco de dados, etc.), loga o erro original e retorna a mensagem de fallback.
 * 
 * @param error - O erro lançado no bloco catch
 * @param fallback - Mensagem amigável padrão a ser exibida para erros não tratados
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AppError) {
    return error.message;
  }

  // Log de erros não tratados para auditoria e debug do servidor
  console.error("[Unhandled Error]", error);

  return fallback;
}
