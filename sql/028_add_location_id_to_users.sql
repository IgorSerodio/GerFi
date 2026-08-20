-- 028_add_location_id_to_users.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) DEFAULT 1;
