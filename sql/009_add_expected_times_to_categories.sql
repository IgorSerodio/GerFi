ALTER TABLE categories 
ADD COLUMN expected_time_normal INTEGER NOT NULL DEFAULT 30,
ADD COLUMN expected_time_priority INTEGER NOT NULL DEFAULT 30;
