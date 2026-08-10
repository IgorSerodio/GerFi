import { z } from "zod";

export const TvSettingsSchema = z.object({
  mode: z.enum(["channel", "playlist", "slides"]),
  youtubeChannel: z.string().optional(),
  videoUrl: z.array(z.object({
    url: z.string().url("URL inválida"),
    videoId: z.string(),
    title: z.string()
  })),
  uploadedFiles: z.array(z.string()).optional(),
  marqueeMessages: z.array(z.string()).default([]),
  slides: z.array(z.object({
    title: z.string(),
    text: z.string(),
    type: z.string(),
  })).default([]),
});
