import { z } from "zod";

export const TvSettingsSchema = z.object({
  mode: z.enum(["live", "files"]),
  videoUrl: z.array(z.object({
    url: z.url("URL inválida"),
    videoId: z.string(),
    title: z.string()
  })),
  uploadedFiles: z.array(z.string()).optional(),
});
