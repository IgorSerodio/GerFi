-- 005_add_custom_tvs.sql
-- Adiciona suporte a múltiplas TVs customizadas

ALTER TABLE tv_settings ADD COLUMN IF NOT EXISTS slug VARCHAR(50) UNIQUE;
ALTER TABLE tv_settings ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE tv_settings ADD COLUMN IF NOT EXISTS services INTEGER[] DEFAULT '{}'::integer[];

UPDATE tv_settings SET slug = 'global', name = 'TV Principal' WHERE id = 1;

-- Alterar a restrição de NOT NULL apenas depois de garantir que a TV global tenha o slug preenchido
ALTER TABLE tv_settings ALTER COLUMN slug SET NOT NULL;
ALTER TABLE tv_settings ALTER COLUMN name SET NOT NULL;
