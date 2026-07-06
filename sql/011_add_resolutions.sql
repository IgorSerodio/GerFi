ALTER TABLE categories ADD COLUMN resolutions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tickets ADD COLUMN resolutions JSONB DEFAULT '[]'::jsonb;
