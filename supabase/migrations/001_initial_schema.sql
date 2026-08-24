-- SunsetScore — initial database schema
-- Apply via: paste into the Supabase SQL editor and run.
--
-- Note: the earthdistance extension (for Phase 3 "near me" queries) is NOT
-- included here. Enable it separately via the Supabase dashboard:
-- Database → Extensions → cube + earthdistance. It has no impact on MVP.

-- ─── Users ─────────────────────────────────────────────────────────────────
-- Extends Supabase Auth — the auth.users row is created by Supabase Auth;
-- this table adds application-level fields.

CREATE TABLE IF NOT EXISTS public.users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT UNIQUE NOT NULL,
  display_name      TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
                    CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own row"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ─── Locations ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.locations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  country      TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  region       TEXT,
  latitude     DECIMAL(9, 6) NOT NULL,
  longitude    DECIMAL(9, 6) NOT NULL,
  timezone     TEXT NOT NULL,
  is_featured  BOOLEAN NOT NULL DEFAULT FALSE,
  population   INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations are public — anyone can read
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations are publicly readable"
  ON public.locations FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE UNIQUE INDEX idx_locations_slug       ON public.locations (slug);
CREATE INDEX        idx_locations_country    ON public.locations (country_code);
CREATE INDEX        idx_locations_featured   ON public.locations (is_featured)
                    WHERE is_featured = TRUE;
-- idx_locations_latlon (earthdistance GIST index) added in 002_geospatial.sql (Phase 3)

-- ─── Sunset forecasts ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sunset_forecasts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id       UUID NOT NULL REFERENCES public.locations (id) ON DELETE CASCADE,
  forecast_date     DATE NOT NULL,

  -- Astronomical (calculated via suncalc, never changes)
  sunset_time        TIMESTAMPTZ,
  sunrise_time       TIMESTAMPTZ,
  solar_noon         TIMESTAMPTZ,
  golden_hour_start  TIMESTAMPTZ,
  golden_hour_end    TIMESTAMPTZ,
  blue_hour_start    TIMESTAMPTZ,
  blue_hour_end      TIMESTAMPTZ,
  sunset_azimuth     DECIMAL(6, 2),

  -- Score output
  score              SMALLINT CHECK (score BETWEEN 0 AND 100),
  quality            TEXT CHECK (quality IN ('poor', 'fair', 'good', 'great', 'excellent')),
  colour_probability DECIMAL(4, 3),
  confidence         DECIMAL(4, 3),

  -- Weather conditions at sunset hour
  cloud_low          DECIMAL(5, 2),
  cloud_mid          DECIMAL(5, 2),
  cloud_high         DECIMAL(5, 2),
  total_cloud        DECIMAL(5, 2),
  rain_probability   DECIMAL(5, 2),
  humidity           DECIMAL(5, 2),
  visibility         DECIMAL(8, 0),   -- metres
  wind_speed         DECIMAL(6, 2),   -- km/h
  wind_direction     DECIMAL(5, 1),   -- degrees
  pressure           DECIMAL(7, 2),   -- hPa
  temperature        DECIMAL(5, 2),   -- °C

  -- Score explanation (JSONB for schema flexibility)
  score_breakdown    JSONB,
  reasons            JSONB,           -- string[]
  warnings           JSONB,           -- string[]

  -- Cache metadata
  weather_source     TEXT NOT NULL DEFAULT 'open-meteo',
  fetched_at         TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (location_id, forecast_date)
);

ALTER TABLE public.sunset_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Forecasts are publicly readable"
  ON public.sunset_forecasts FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE INDEX idx_forecasts_location_date ON public.sunset_forecasts (location_id, forecast_date);
CREATE INDEX idx_forecasts_date          ON public.sunset_forecasts (forecast_date);
CREATE INDEX idx_forecasts_expires       ON public.sunset_forecasts (expires_at)
                                         WHERE expires_at IS NOT NULL;

-- ─── Saved locations ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  location_id   UUID NOT NULL REFERENCES public.locations (id) ON DELETE CASCADE,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, location_id)
);

ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved locations"
  ON public.saved_locations
  USING (auth.uid() = user_id);

CREATE INDEX idx_saved_user ON public.saved_locations (user_id);

-- ─── Alert preferences ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.alert_preferences (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  location_id           UUID NOT NULL REFERENCES public.locations (id) ON DELETE CASCADE,
  min_score             SMALLINT NOT NULL DEFAULT 80,
  min_colour_probability DECIMAL(4, 3) NOT NULL DEFAULT 0.70,
  hours_before_sunset   SMALLINT NOT NULL DEFAULT 3,
  channel               TEXT NOT NULL DEFAULT 'email'
                        CHECK (channel IN ('email', 'push')),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alerts"
  ON public.alert_preferences
  USING (auth.uid() = user_id);

CREATE INDEX idx_alerts_user   ON public.alert_preferences (user_id);
CREATE INDEX idx_alerts_active ON public.alert_preferences (is_active)
                                WHERE is_active = TRUE;

-- ─── Email subscribers ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  location_interest TEXT,
  source            TEXT,
  confirmed         BOOLEAN NOT NULL DEFAULT FALSE,
  confirm_token     TEXT,
  subscribed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at   TIMESTAMPTZ
);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
-- Only accessible via service role key (admin operations only)

-- ─── Subscriptions ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT UNIQUE,
  stripe_price_id         TEXT,
  tier                    TEXT NOT NULL CHECK (tier IN ('pro')),
  status                  TEXT NOT NULL,
  period_start            TIMESTAMPTZ,
  period_end              TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_subscriptions_user   ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions (stripe_subscription_id);

-- ─── Analytics events ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  TEXT NOT NULL,
  user_id     UUID REFERENCES public.users (id) ON DELETE SET NULL,
  session_id  TEXT,
  location_id UUID REFERENCES public.locations (id) ON DELETE SET NULL,
  properties  JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
-- Only writable via service role key

CREATE INDEX idx_events_name    ON public.analytics_events (event_name);
CREATE INDEX idx_events_at      ON public.analytics_events (occurred_at DESC);
CREATE INDEX idx_events_user    ON public.analytics_events (user_id)
                                 WHERE user_id IS NOT NULL;

-- ─── Forecast ratings (Phase 4 — schema ready, features not built) ──────────

CREATE TABLE IF NOT EXISTS public.forecast_ratings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id      UUID NOT NULL REFERENCES public.sunset_forecasts (id) ON DELETE CASCADE,
  user_id          UUID REFERENCES public.users (id) ON DELETE SET NULL,
  predicted_score  SMALLINT,
  actual_rating    SMALLINT CHECK (actual_rating BETWEEN 1 AND 5),
  photo_url        TEXT,
  comment          TEXT,
  rated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.forecast_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own ratings"
  ON public.forecast_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ratings are publicly readable"
  ON public.forecast_ratings FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE INDEX idx_ratings_forecast ON public.forecast_ratings (forecast_id);

-- ─── Trigger: keep updated_at current ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_forecasts_updated_at
  BEFORE UPDATE ON public.sunset_forecasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON public.alert_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- Supabase does not automatically grant table-level privileges when tables are
-- created via raw SQL. service_role bypasses RLS but still needs table grants.

GRANT USAGE ON SCHEMA public TO service_role, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
