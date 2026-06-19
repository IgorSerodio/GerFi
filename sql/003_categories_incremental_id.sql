-- 003_categories_incremental_id.sql
ALTER TABLE categories DROP CONSTRAINT categories_pkey CASCADE;
ALTER TABLE categories ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE categories ADD CONSTRAINT categories_code_key UNIQUE (code);
