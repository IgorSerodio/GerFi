-- 002_add_categories_and_ticket_windows.sql

CREATE TABLE IF NOT EXISTS categories (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  icon VARCHAR(50),
  color VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS ticket_windows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);
