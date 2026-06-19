import { z } from "zod";

export const IssueTicketSchema = z.object({
  type: z.string().min(1, "O tipo de serviço é obrigatório"),
  categoryName: z.string().min(1, "O nome da categoria é obrigatório"),
  priority: z.enum(["Normal", "Prioritário"]),
});

export const FinishTicketSchema = z.object({
  ticketId: z.string().min(1, "O ID do ticket é obrigatório"),
  observation: z.string().max(300, "A observação deve ter no máximo 300 caracteres").optional(),
});

export const ForwardTicketSchema = z.object({
  ticketId: z.string().min(1, "O ID do ticket é obrigatório"),
  targetGuiche: z.string().min(1, "O guichê de destino é obrigatório"),
});

export const TvSettingsSchema = z.object({
  mode: z.enum(["live", "files"]),
  videoUrl: z.array(z.object({
    url: z.string().url("URL inválida"),
    videoId: z.string(),
    title: z.string()
  })),
  uploadedFiles: z.array(z.string()).optional(),
});
