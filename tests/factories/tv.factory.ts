import { TvSettings } from "@/features/tv/types";

export const buildTvPayload = (overrides: Partial<TvSettings> = {}) => ({
  slug: `tv_teste_${Date.now()}`,
  name: "TV Recepção Teste",
  mode: "channel" as any,
  youtubeChannel: "@GerFiChannel",
  videoUrl: [],
  locationId: 1, 
  marqueeMessages: ["Bem-vindo ao sistema", "Aguarde ser chamado"],
  ...overrides,
});
