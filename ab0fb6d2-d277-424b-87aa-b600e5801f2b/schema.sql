-- HomeKey Clean, Postgres schema. Safe to re-run.
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'client',
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS cleaners (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tier integer NOT NULL DEFAULT 4,
  headline text, bio text, areas text,
  years_experience integer NOT NULL DEFAULT 0,
  rating_sum integer NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  jobs_completed integer NOT NULL DEFAULT 0,
  earnings_released_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  id_verified integer NOT NULL DEFAULT 0,
  background_check integer NOT NULL DEFAULT 0,
  payment_on_file integer NOT NULL DEFAULT 0,
  avatar text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cleaner_id text REFERENCES users(id) ON DELETE SET NULL,
  service_type text NOT NULL DEFAULT 'residential',
  tier integer NOT NULL,
  hours double precision NOT NULL,
  cleaner_rate_cents integer NOT NULL,
  client_rate_cents integer NOT NULL,
  cleaner_payout_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  total_cents integer NOT NULL,
  address text NOT NULL, unit text, city text NOT NULL, zip text NOT NULL, county text NOT NULL,
  bedrooms integer, bathrooms integer, sqft integer,
  scheduled_at timestamptz NOT NULL,
  frequency text NOT NULL DEFAULT 'once',
  addons text NOT NULL DEFAULT '[]',
  pets text, access_notes text, notes text,
  status text NOT NULL DEFAULT 'open',
  preferred_cleaner_id text,
  first_refusal_until timestamptz,
  claim_fee_cents integer NOT NULL DEFAULT 1000,
  payout_released integer NOT NULL DEFAULT 0,
  claimed_at timestamptz, completed_at timestamptz, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bookings_board ON bookings(status, tier);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cleaner ON bookings(cleaner_id);
CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  booking_id text NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  cleaner_id text NOT NULL, client_id text NOT NULL,
  stars integer NOT NULL, comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_cleaner ON reviews(cleaner_id);

-- Referral agency additions
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS hourly_rate_cents integer NOT NULL DEFAULT 4000;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'listed';
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS accepting integer NOT NULL DEFAULT 1;
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS specialties text NOT NULL DEFAULT '[]';
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS fees_owed_cents integer NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS referrals (
  id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cleaner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type text NOT NULL DEFAULT 'residential',
  hourly_rate_cents integer NOT NULL,
  hours double precision NOT NULL,
  estimate_cents integer NOT NULL,
  lead_fee_cents integer NOT NULL DEFAULT 0,
  address text NOT NULL, unit text, city text NOT NULL, zip text NOT NULL, county text NOT NULL,
  bedrooms integer, bathrooms integer, sqft integer,
  scheduled_at timestamptz NOT NULL,
  frequency text NOT NULL DEFAULT 'once',
  addons text NOT NULL DEFAULT '[]',
  pets text, access_notes text, notes text,
  status text NOT NULL DEFAULT 'requested',
  decline_reason text,
  disclosure_ack integer NOT NULL DEFAULT 0,
  responded_at timestamptz, completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referrals_client ON referrals(client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_cleaner ON referrals(cleaner_id, status);
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey;
