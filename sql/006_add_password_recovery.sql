-- 006_add_password_recovery.sql
-- Adiciona colunas para controle de recuperação de senha (Esqueci minha senha)

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_pin VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_pin_expires TIMESTAMP;
