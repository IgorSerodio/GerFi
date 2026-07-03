/**
 * Valida o formato de um endereço de e-mail
 */
export function isValidEmail(email: string): boolean {
  // Regex básica para e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
