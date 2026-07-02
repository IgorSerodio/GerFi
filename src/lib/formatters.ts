/**
 * Limpa qualquer caractere não numérico de uma string
 */
export function removeNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formata um CPF no formato 000.000.000-00 e limita a 11 dígitos
 */
export function formatCpf(value: string): string {
  let cpf = removeNonDigits(value);
  if (cpf.length > 11) cpf = cpf.slice(0, 11);
  
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Retorna apenas os dígitos de uma matrícula, limitados a 6
 */
export function formatMatricula(value: string): string {
  let matricula = removeNonDigits(value);
  if (matricula.length > 6) matricula = matricula.slice(0, 6);
  return matricula;
}
