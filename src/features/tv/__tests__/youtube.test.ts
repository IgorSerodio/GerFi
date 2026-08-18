import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveYoutubeChannelAction, checkYoutubeLiveStatusAction } from "../services/youtube";

// Mock do global.fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("YouTube Service (Mocked Integration)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resolveYoutubeChannelAction", () => {
    it("Deve extrair o Channel ID a partir do HTML simulado", async () => {
      fetchMock.mockResolvedValueOnce({
        text: async () => `<html><head>
          <meta itemprop="channelId" content="UC1234567890abcdef">
          <meta property="og:title" content="Canal de Teste">
          <meta property="og:image" content="https://avatar.com/image.jpg">
        </head><body></body></html>`
      } as unknown as Response);

      const result = await resolveYoutubeChannelAction("https://youtube.com/@CanalDeTeste");
      expect(result.success).toBe(true);
      expect(result.data?.channelId).toBe("UC1234567890abcdef");
      expect(result.data?.title).toBe("Canal de Teste");
      expect(result.data?.playlistId).toBe("UU1234567890abcdef"); // Substitui UC por UU
    });

    it("Deve falhar graciosamente se não encontrar o canal", async () => {
      fetchMock.mockResolvedValueOnce({
        text: async () => `<html><body>Sem metadados aqui</body></html>`
      } as unknown as Response);

      const result = await resolveYoutubeChannelAction("https://youtube.com/@Desconhecido");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Canal não encontrado");
    });
  });

  describe("checkYoutubeLiveStatusAction", () => {
    it("Deve detectar quando o canal está ao vivo", async () => {
      fetchMock.mockResolvedValueOnce({
        text: async () => `<html><body>"isLiveNow":true,"videoId":"abc123xyz00"</body></html>`
      } as unknown as Response);

      const result = await checkYoutubeLiveStatusAction("UC1234567890abcdef");
      expect(result.success).toBe(true);
      expect(result.isLive).toBe(true);
      expect(result.liveVideoId).toBe("abc123xyz00");
    });

    it("Deve retornar false se o canal estiver offline", async () => {
      fetchMock.mockResolvedValueOnce({
        text: async () => `<html><body>Nenhuma live acontecendo</body></html>`
      } as unknown as Response);

      const result = await checkYoutubeLiveStatusAction("UC1234567890abcdef");
      expect(result.success).toBe(true);
      expect(result.isLive).toBe(false);
      expect(result.liveVideoId).toBeUndefined();
    });
  });
});
