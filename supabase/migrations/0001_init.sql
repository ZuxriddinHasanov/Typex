CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PSA announcements
CREATE TABLE psa (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  date BIGINT,
  level INTEGER,
  sticky BOOLEAN DEFAULT false
);

-- Admin user IDs
CREATE TABLE admin_uids (
  uid TEXT PRIMARY KEY
);

-- Admin panel credentials (username + bcrypt hash)
CREATE TABLE admin_credentials (
  username TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- User password hashes (email/parol auth)
CREATE TABLE user_passwords (
  uid TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- Password reset tokens
CREATE TABLE password_resets (
  token TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- Quote ratings
CREATE TABLE quote_ratings (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL,
  language TEXT NOT NULL,
  average NUMERIC(5,1),
  ratings INTEGER NOT NULL DEFAULT 0,
  total_rating NUMERIC NOT NULL DEFAULT 0,
  UNIQUE(quote_id, language)
);

-- User configs (JSONB for flexibility)
CREATE TABLE configs (
  uid TEXT PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}'
);

-- System logs
CREATE TABLE logs (
  id BIGSERIAL PRIMARY KEY,
  type TEXT,
  timestamp BIGINT NOT NULL,
  uid TEXT NOT NULL DEFAULT '',
  important BOOLEAN DEFAULT false,
  event TEXT NOT NULL,
  message JSONB NOT NULL
);

-- Reports
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  uid TEXT NOT NULL,
  content_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  comment TEXT NOT NULL
);

-- Presets
CREATE TABLE presets (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  timestamp BIGINT NOT NULL
);

-- Ape keys
CREATE TABLE ape_keys (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NOT NULL,
  name TEXT NOT NULL,
  hash TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_on BIGINT NOT NULL,
  modified_on BIGINT NOT NULL,
  last_used_on BIGINT NOT NULL DEFAULT -1
);

-- Blocklist
CREATE TABLE blocklist (
  _id TEXT PRIMARY KEY,
  username_hash TEXT UNIQUE,
  email_hash TEXT UNIQUE,
  discord_id_hash TEXT UNIQUE,
  timestamp BIGINT NOT NULL
);

-- Results
CREATE TABLE results (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT NOT NULL,
  wpm NUMERIC NOT NULL,
  raw_wpm NUMERIC NOT NULL,
  char_stats JSONB NOT NULL,
  acc NUMERIC NOT NULL,
  mode TEXT NOT NULL,
  mode2 TEXT NOT NULL,
  quote_length INTEGER,
  timestamp BIGINT NOT NULL,
  test_duration NUMERIC NOT NULL,
  consistency NUMERIC NOT NULL,
  key_consistency NUMERIC,
  chart_data JSONB NOT NULL,
  restart_count INTEGER DEFAULT 0,
  incomplete_test_seconds NUMERIC,
  afk_duration NUMERIC,
  tags JSONB DEFAULT '[]',
  bailed_out BOOLEAN DEFAULT false,
  blind_mode BOOLEAN DEFAULT false,
  lazy_mode BOOLEAN DEFAULT false,
  funbox JSONB,
  language TEXT,
  difficulty TEXT,
  numbers BOOLEAN DEFAULT false,
  punctuation BOOLEAN DEFAULT false,
  name TEXT NOT NULL DEFAULT '',
  is_pb BOOLEAN DEFAULT false,
  key_spacing_stats JSONB,
  key_duration_stats JSONB
);

-- New quotes (submission queue)
CREATE TABLE new_quotes (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  source TEXT NOT NULL,
  language TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false
);

-- Social connections
CREATE TABLE connections (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  initiator_uid TEXT NOT NULL,
  initiator_name TEXT NOT NULL,
  receiver_uid TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  last_modified BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked'))
);

-- Leaderboard entries (materialized on update)
CREATE TABLE leaderboard_entries (
  uid TEXT NOT NULL,
  language TEXT NOT NULL,
  mode TEXT NOT NULL,
  mode2 TEXT NOT NULL,
  numbers BOOLEAN DEFAULT false,
  wpm NUMERIC NOT NULL,
  acc NUMERIC NOT NULL,
  raw NUMERIC,
  consistency NUMERIC,
  timestamp BIGINT NOT NULL,
  rank INTEGER NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  discord_id TEXT,
  discord_avatar TEXT,
  badge_id INTEGER,
  is_premium BOOLEAN DEFAULT false,
  PRIMARY KEY (uid, language, mode, mode2, numbers)
);

-- Public stats (key-value: 'stats' or 'speedStatsHistogram')
-- Server configuration (single row, key-value)
CREATE TABLE configuration (
  _id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE public_stats (
  _id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- Users (core table, JSONB for nested data)
CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL DEFAULT '',
  added_at BIGINT NOT NULL,
  gender TEXT,
  age INTEGER,
  avatar TEXT,
  personal_bests JSONB NOT NULL DEFAULT '{}',
  lb_personal_bests JSONB DEFAULT '{}',
  last_result_hashes JSONB DEFAULT '[]',
  completed_tests INTEGER DEFAULT 0,
  started_tests INTEGER DEFAULT 0,
  time_typing NUMERIC DEFAULT 0,
  streak JSONB,
  xp BIGINT DEFAULT 0,
  discord_id TEXT,
  discord_avatar TEXT,
  tags JSONB DEFAULT '[]',
  profile_details JSONB DEFAULT '{}',
  custom_themes JSONB DEFAULT '[]',
  premium JSONB,
  quote_ratings JSONB,
  favorite_quotes JSONB DEFAULT '{}',
  lb_memory JSONB DEFAULT '{}',
  inventory JSONB DEFAULT '{"badges":[]}',
  banned BOOLEAN DEFAULT false,
  lb_opt_out BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  needs_to_change_name BOOLEAN DEFAULT false,
  quote_mod JSONB,
  result_filter_presets JSONB DEFAULT '[]',
  test_activity JSONB DEFAULT '{}',
  auto_ban_timestamps JSONB DEFAULT '[]',
  inbox JSONB DEFAULT '[]',
  ips JSONB DEFAULT '[]',
  can_report BOOLEAN DEFAULT true,
  name_history JSONB DEFAULT '[]',
  last_name_change BIGINT,
  can_manage_ape_keys BOOLEAN DEFAULT false,
  bananas INTEGER DEFAULT 0,
  suspicious BOOLEAN DEFAULT false,
  note TEXT,
  last_login_at BIGINT,
  token_version INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE user_passwords
  ADD CONSTRAINT user_passwords_uid_fkey
  FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_results_uid ON results(uid);
CREATE INDEX idx_results_uid_timestamp ON results(uid, timestamp DESC);
CREATE INDEX idx_connections_initiator ON connections(initiator_uid, status);
CREATE INDEX idx_connections_receiver ON connections(receiver_uid, status);
CREATE INDEX idx_connections_key ON connections(key);
CREATE INDEX idx_presets_uid ON presets(uid);
CREATE INDEX idx_ape_keys_uid ON ape_keys(uid);
CREATE INDEX idx_new_quotes_language ON new_quotes(language);
CREATE INDEX idx_new_quotes_approved ON new_quotes(approved);
CREATE INDEX idx_logs_uid ON logs(uid);
CREATE INDEX idx_leaderboard_entries_lookup ON leaderboard_entries(language, mode, mode2, numbers, rank);
CREATE UNIQUE INDEX idx_users_email_unique ON users (LOWER(email));
CREATE UNIQUE INDEX idx_users_name_unique ON users (LOWER(name));
