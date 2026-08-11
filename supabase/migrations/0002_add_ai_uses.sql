ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_uses JSONB DEFAULT '{"date":"","count":0}';
