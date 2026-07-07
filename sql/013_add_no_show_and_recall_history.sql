-- 013_add_no_show_and_recall_history.sql
-- Adiciona a coluna recall_history para guardar o histórico de tentativas de rechamadas
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS recall_history TIMESTAMP[] DEFAULT '{}';
