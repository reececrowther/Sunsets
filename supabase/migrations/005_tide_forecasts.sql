-- Tidal extremes (high / low) per location per day.
-- Populated by the daily cron job via WorldTides API.
-- Extremes stored as a JSONB array to avoid one-row-per-extreme overhead.

CREATE TABLE IF NOT EXISTS tide_forecasts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     uuid        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  forecast_date   date        NOT NULL,
  extremes        jsonb       NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tide_forecasts_location_date
  ON tide_forecasts (location_id, forecast_date);

ALTER TABLE tide_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON tide_forecasts
  FOR SELECT USING (true);
