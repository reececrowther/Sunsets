-- Alert preferences — Pro users set a min score threshold per location.
-- The cron job checks this table after each refresh and sends email alerts.
-- last_triggered_date prevents duplicate alerts within the same calendar day.

CREATE TABLE IF NOT EXISTS public.alert_preferences (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id          UUID        NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  min_score            INTEGER     NOT NULL DEFAULT 70 CHECK (min_score BETWEEN 1 AND 100),
  channel              TEXT        NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'push')),
  is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
  last_triggered_date  DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, location_id)
);

CREATE INDEX idx_alert_preferences_user     ON public.alert_preferences (user_id);
CREATE INDEX idx_alert_preferences_location ON public.alert_preferences (location_id);

-- RLS: each user can only see and manage their own preferences
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alert preferences"
  ON public.alert_preferences
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
