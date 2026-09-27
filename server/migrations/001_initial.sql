CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text,
  username text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  email_verified boolean NOT NULL DEFAULT false,
  google_subject text UNIQUE,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nearby_port_threshold_km double precision NOT NULL DEFAULT 50 CHECK (nearby_port_threshold_km BETWEEN 1 AND 500),
  email_notifications boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE TABLE IF NOT EXISTS cruise_companies (id text PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS ships (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES cruise_companies(id),
  name text NOT NULL,
  UNIQUE(company_id, name)
);
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id text NOT NULL REFERENCES cruise_companies(id),
  ship_id text NOT NULL REFERENCES ships(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_date <= end_date)
);
CREATE INDEX IF NOT EXISTS assignments_user_dates_idx ON assignments(user_id, start_date, end_date);
CREATE TABLE IF NOT EXISTS port_calls (
  id text PRIMARY KEY,
  ship_id text NOT NULL REFERENCES ships(id),
  port_id text NOT NULL,
  port_name text NOT NULL,
  country_code text,
  arrival_at timestamptz NOT NULL,
  departure_at timestamptz NOT NULL,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  source_updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (arrival_at < departure_at)
);
CREATE INDEX IF NOT EXISTS port_calls_ship_time_idx ON port_calls(ship_id, arrival_at, departure_at);
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY,
  user_low uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_low <> user_high),
  UNIQUE(user_low, user_high)
);
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE TABLE IF NOT EXISTS connection_tokens (
  token_hash text PRIMARY KEY,
  issuer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz,
  claimed_by uuid REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS overlap_events (
  id uuid PRIMARY KEY,
  fingerprint text NOT NULL UNIQUE,
  user_low uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_high uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('same_port','nearby_port','same_ship')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  port_calls jsonb NOT NULL DEFAULT '[]',
  distance_km double precision,
  suppressed boolean NOT NULL DEFAULT false,
  intent_sender_id uuid REFERENCES users(id),
  intent_status text NOT NULL DEFAULT 'none' CHECK (intent_status IN ('none','poked','interested','not_interested')),
  intent_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_at < ends_at)
);
CREATE INDEX IF NOT EXISTS overlaps_users_time_idx ON overlap_events(user_low, user_high, starts_at, ends_at);
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overlap_id uuid REFERENCES overlap_events(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('overlap_upcoming','poke_received','poke_response')),
  deduplication_key text NOT NULL UNIQUE,
  read boolean NOT NULL DEFAULT false,
  delivered_at timestamptz,
  delivery_attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO cruise_companies(id, name) VALUES
  ('royal-caribbean', 'Royal Caribbean'), ('celebrity', 'Celebrity Cruises')
ON CONFLICT DO NOTHING;
INSERT INTO ships(id, company_id, name) VALUES
  ('wonder-of-the-seas', 'royal-caribbean', 'Wonder of the Seas'),
  ('celebrity-ascent', 'celebrity', 'Celebrity Ascent')
ON CONFLICT DO NOTHING;
