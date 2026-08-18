import { describe, it, expect } from "vitest";
import { isValidEmail, isValidCpf, isValidMatricula } from '@/lib/validators';

describe("Validators", () => {
  describe("isValidEmail", () => {
    it("deve retornar true para e-mails válidos", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("usuario.nome@dominio.com.br")).toBe(true);
      expect(isValidEmail("a@b.c")).toBe(true);
    });

    it("deve retornar false para e-mails inválidos", () => {
      expect(isValidEmail("test@example")).toBe(false); // sem TLD
      expect(isValidEmail("testexample.com")).toBe(false); // sem @
      expect(isValidEmail("test @example.com")).toBe(false); // com espaço
      expect(isValidEmail("")).toBe(false); // vazio
    });
  });

  describe("isValidCpf", () => {
    it("deve retornar true para CPFs numéricos de 11 dígitos", () => {
      expect(isValidCpf("12345678901")).toBe(true);
      expect(isValidCpf("00000000000")).toBe(true);
    });

    it("deve retornar false para CPFs inválidos (tamanho incorreto ou com letras/pontuação)", () => {
      expect(isValidCpf("1234567890")).toBe(false); // 10 dígitos
      expect(isValidCpf("123456789012")).toBe(false); // 12 dígitos
      expect(isValidCpf("123.456.789-01")).toBe(false); // com pontuação
      expect(isValidCpf("1234567890a")).toBe(false); // com letras
      expect(isValidCpf("")).toBe(false); // vazio
    });
  });

  describe("isValidMatricula", () => {
    it("deve retornar true para matrículas numéricas de 6 dígitos", () => {
      expect(isValidMatricula("123456")).toBe(true);
      expect(isValidMatricula("000000")).toBe(true);
    });

    it("deve retornar false para matrículas inválidas", () => {
      expect(isValidMatricula("12345")).toBe(false); // 5 dígitos
      expect(isValidMatricula("1234567")).toBe(false); // 7 dígitos
      expect(isValidMatricula("12345a")).toBe(false); // com letras
      expect(isValidMatricula("")).toBe(false); // vazio
    });
  });
});
