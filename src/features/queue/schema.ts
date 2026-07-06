import { z } from "zod";

export const IssueTicketSchema = z.object({
  categoryId: z.number().int().positive("A categoria é obrigatória"),
  categoryName: z.string().min(1, "O nome da categoria é obrigatório"),
  priority: z.enum(["Normal", "Prioritário"]),
});

export const FinishTicketSchema = z.object({
  ticketId: z.string().min(1, "O ID do ticket é obrigatório"),
  observation: z.string().max(300, "A observação deve ter no máximo 300 caracteres").optional(),
  resolutions: z.array(z.string()).optional(),
});

export const ForwardTicketSchema = z.object({
  ticketId: z.string().min(1, "O ID do ticket é obrigatório"),
  targetGuiche: z.string().min(1, "O guichê de destino é obrigatório"),
});

