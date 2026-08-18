import { describe, it, expect, vi } from "vitest";
import { AppError, getErrorMessage } from '@/lib/errors';

describe("Errors module", () => {
  describe("AppError", () => {
    it("deve instanciar com a mensagem e o nome corretos", () => {
      const error = new AppError("Mensagem amigável de teste");
      
      expect(error.message).toBe("Mensagem amigável de teste");
      expect(error.name).toBe("AppError");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("getErrorMessage", () => {
    it("deve retornar a mensagem real se o erro for uma instância de AppError", () => {
      const error = new AppError("Erro de regra de negócio");
      const result = getErrorMessage(error, "Fallback");
      
      expect(result).toBe("Erro de regra de negócio");
    });

    it("deve mascarar a mensagem e retornar o fallback se for um Error nativo", () => {
      // Suprimir o console.error temporariamente para não poluir o log do teste
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      const error = new Error("Erro vazado do banco de dados: duplicate key value");
      const result = getErrorMessage(error, "Mensagem genérica segura");
      
      expect(result).toBe("Mensagem genérica segura");
      expect(consoleSpy).toHaveBeenCalledWith("[Unhandled Error]", error);
      
      consoleSpy.mockRestore();
    });

    it("deve mascarar a mensagem e retornar o fallback se o erro não for um objeto Error", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      const result = getErrorMessage("String lançada como erro", "Mensagem genérica segura");
      
      expect(result).toBe("Mensagem genérica segura");
      expect(consoleSpy).toHaveBeenCalledWith("[Unhandled Error]", "String lançada como erro");
      
      consoleSpy.mockRestore();
    });
  });
});
