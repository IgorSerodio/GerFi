import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTvSettingsAction,
  updateTvSettingsAction,
  getTvSettingsAction,
  getAllTvSettingsAction,
  deleteTvSettingsAction
} from '@/features/tv/actions';
import { pool } from "@/infra/database";

describe("TV Actions (Integration)", () => {
  let createdTvId: number;

  beforeAll(async () => {
    await pool.query("DELETE FROM tv_settings WHERE slug = 'tv_teste_integracao'");
  });

  afterAll(async () => {
    if (createdTvId) {
      await pool.query("DELETE FROM tv_settings WHERE id = $1", [createdTvId]);
    }
    await pool.end();
  });

  it("Deve criar uma configuração de TV (createTvSettingsAction)", async () => {
    const payload = {
      slug: "tv_teste_integracao",
      name: "TV Recepção Teste",
      mode: "channel" as any,
      youtubeChannel: "@GerFiChannel",
      videoUrl: [],
      locationId: 1, // Assumindo que Location 1 existe ou nullable bypass
      marqueeMessages: ["Bem-vindo ao sistema", "Aguarde ser chamado"],
    };

    const result = await createTvSettingsAction(payload);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    createdTvId = result.data?.id as number;
    expect(createdTvId).toBeGreaterThan(0);
    expect(result.data?.slug).toBe("tv_teste_integracao");
    expect(result.data?.marqueeMessages).toEqual(payload.marqueeMessages);
  });

  it("Deve buscar todas as configurações de TV (getAllTvSettingsAction)", async () => {
    const result = await getAllTvSettingsAction();
    expect(result.success).toBe(true);
    expect(result.data?.length).toBeGreaterThan(0);
    
    const tvs = result.data as any[];
    const found = tvs.find(tv => tv.id === createdTvId);
    expect(found).toBeDefined();
    expect(found.slug).toBe("tv_teste_integracao");
  });

  it("Deve buscar configuração de uma TV pelo slug (getTvSettingsAction)", async () => {
    const result = await getTvSettingsAction("tv_teste_integracao");
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(createdTvId);
  });

  it("Deve atualizar a TV (updateTvSettingsAction)", async () => {
    const updatePayload = {
      id: createdTvId,
      slug: "tv_teste_integracao",
      name: "TV Recepção Teste Atualizada",
      mode: "playlist" as any,
      videoUrl: [{ url: "https://youtube.com/watch?v=123", videoId: "123", title: "Test Video" }],
      locationId: 1,
      marqueeMessages: ["Mensagem Atualizada"],
    };

    const result = await updateTvSettingsAction(updatePayload);
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("TV Recepção Teste Atualizada");
    expect(result.data?.mode).toBe("playlist");
    expect(result.data?.marqueeMessages).toEqual(["Mensagem Atualizada"]);
  });

  it("Deve deletar a TV (deleteTvSettingsAction)", async () => {
    const result = await deleteTvSettingsAction(createdTvId);
    
    if (createdTvId === 1) {
      expect(result.success).toBe(false);
      expect(result.error).toContain("A TV Principal não pode ser excluída");
    } else {
      expect(result.success).toBe(true);
      const check = await getTvSettingsAction("tv_teste_integracao");
      if (check.success) {
        expect(check.data).toBeFalsy();
      } else {
        expect(check.success).toBe(false);
      }
    }
    
    createdTvId = 0;
  });
});
