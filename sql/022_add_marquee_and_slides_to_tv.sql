-- 022_add_marquee_and_slides_to_tv.sql
-- Adiciona suporte a mensagens dinâmicas no letreiro e slides de texto

ALTER TABLE tv_settings ADD COLUMN IF NOT EXISTS marquee_messages JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tv_settings ADD COLUMN IF NOT EXISTS slides JSONB DEFAULT '[]'::jsonb;

