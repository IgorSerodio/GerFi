-- 004_refactor_categories_to_id.sql
BEGIN;

-- 1. Alter categories table
ALTER TABLE categories DROP COLUMN code CASCADE;
ALTER TABLE categories ADD COLUMN ticket_char VARCHAR(1) NOT NULL DEFAULT 'G';

-- 2. Alter tickets table
TRUNCATE TABLE tickets CASCADE;
ALTER TABLE tickets DROP COLUMN type CASCADE;
ALTER TABLE tickets ADD COLUMN category_id INTEGER REFERENCES categories(id) NOT NULL;

-- 3. Alter users table
ALTER TABLE users DROP COLUMN services CASCADE;
ALTER TABLE users ADD COLUMN services INTEGER[] DEFAULT '{}'::integer[];

COMMIT;
