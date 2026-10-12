-- Aurora forecast table — stores one row per location per day.
-- Kp data comes from NOAA SWPC (free, no key). Cloud data is read
-- from tonight's sunset_forecasts row for the same location.

CREATE TABLE IF NOT EXISTS public.aurora_forecasts (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id    UUID          NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  forecast_date  DATE          NOT NULL,

  kp_peak        NUMERIC(4, 2) NOT NULL,   -- peak Kp during tonight's dark window
  aurora_score   SMALLINT      NOT NULL CHECK (aurora_score BETWEEN 0 AND 100),
  quality        TEXT          NOT NULL CHECK (quality IN ('high_activity', 'moderate', 'low', 'marginal', 'unlikely')),
  cloud_penalty  NUMERIC(4, 3) NOT NULL,   -- 0–1 fraction of sky blocked by cloud
  min_kp_needed  NUMERIC(3, 1) NOT NULL,   -- minimum Kp for visibility at this latitude
  dark_start     TIMESTAMPTZ,              -- start of viewing window (nautical dusk)
  dark_end       TIMESTAMPTZ,              -- end of viewing window (nautical dawn)

  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (location_id, forecast_date)
);

ALTER TABLE public.aurora_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aurora forecasts are publicly readable"
  ON public.aurora_forecasts FOR SELECT TO anon, authenticated USING (TRUE);

CREATE INDEX idx_aurora_location_date ON public.aurora_forecasts (location_id, forecast_date);
CREATE INDEX idx_aurora_date          ON public.aurora_forecasts (forecast_date);
