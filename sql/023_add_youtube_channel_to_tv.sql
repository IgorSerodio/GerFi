-- Adiciona a coluna se não existir
ALTER TABLE tv_settings 
ADD COLUMN IF NOT EXISTS youtube_channel VARCHAR(255);

-- Tenta remover a constraint antiga caso exista (ignora erros se não existir, mas o IF EXISTS já trata)
ALTER TABLE tv_settings DROP CONSTRAINT IF EXISTS tv_settings_mode_check;

-- Atualiza os registros existentes para o novo padrão de enumeração no front
UPDATE tv_settings SET mode = 'playlist' WHERE mode = 'files';
UPDATE tv_settings SET mode = 'channel' WHERE mode = 'live';
