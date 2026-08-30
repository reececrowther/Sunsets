-- Sunset ratings — user-submitted quality signals for back-testing the algorithm.
-- Anonymous (no user_id); one row per submission. The client uses localStorage
-- to prevent the same browser from rating twice; server deduplication is not required.

CREATE TABLE IF NOT EXISTS public.sunset_ratings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID        NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  forecast_date DATE        NOT NULL,
  rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  notes         TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup for aggregating ratings by location + date
CREATE INDEX idx_sunset_ratings_lookup
  ON public.sunset_ratings (location_id, forecast_date);

-- RLS — public read and insert, no updates or deletes
ALTER TABLE public.sunset_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a rating"
  ON public.sunset_ratings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read ratings"
  ON public.sunset_ratings FOR SELECT
  TO anon, authenticated
  USING (true);
