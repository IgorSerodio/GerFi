/**
 * Valida o formato de um endereço de e-mail
 */
export function isValidEmail(email: string): boolean {
  // Regex básica para e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se um CPF possui exatos 11 dígitos numéricos
 */
export function isValidCpf(cpf: string): boolean {
  return cpf.length === 11 && /^\d+$/.test(cpf);
}

/**
 * Valida se uma matrícula possui exatos 6 dígitos numéricos
 */
export function isValidMatricula(matricula: string): boolean {
  return matricula.length === 6 && /^\d+$/.test(matricula);
}
