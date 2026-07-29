-- Adiciona coluna de apelido opcional para os guichês
ALTER TABLE ticket_windows ADD COLUMN IF NOT EXISTS alias VARCHAR(100);
