# SunsetScore — Data Sources & Licensing

This document records all third-party services, their licences, and any commercial or attribution obligations.
Update this file whenever a new external service is added.

---

## Weather — Open-Meteo

**Website:** https://open-meteo.com  
**Plan:** Commercial (€10/month, 100,000 API calls/day)  
**Licence:** Commercial tier allows unrestricted commercial use with no attribution requirement.  
**Caching:** Permitted — we store all forecast data in our database.  
**Data redistribution:** Permitted under the commercial plan.  
**Rate limits:** 100,000 API calls/day on commercial tier; our usage is approximately 1,000–15,000/day depending on tracked locations.  
**Models used:** ECMWF IFS (Europe), GFS (global fallback).  
**Attribution:** Not required on paid plans.

### Key fields used
- `cloud_cover_high` — high-altitude cloud (cirrus/cirrostratus), essential for scoring
- `cloud_cover_mid` — mid-altitude cloud (altocumulus/altostratus)
- `cloud_cover_low` — low-altitude cloud (stratus/cumulus), primary horizon-block indicator
- `precipitation_probability` — rain risk factor
- `visibility` — metres, affects colour transmission
- `relative_humidity_2m` — atmospheric moisture factor
- `surface_pressure` — stability indicator
- `wind_speed_10m`, `wind_direction_10m`
- `temperature_2m`

---

## Astronomical calculations — suncalc

**npm package:** `suncalc`  
**Version:** see package.json  
**Licence:** MIT — unrestricted commercial use, no attribution required.  
**Source:** https://github.com/mourner/suncalc  
**API calls:** None — pure mathematical calculation, runs locally.  
**Data redistribution:** N/A — no external data.

### Usage
Used to calculate: sunrise time, sunset time, solar noon, golden hour (start/end),
blue hour (civil twilight start/end), and solar azimuth at sunset (for the compass direction feature).
Calculations are deterministic for a given latitude/longitude/date — no freshness concerns.

---

## Geocoding — Mapbox

**Website:** https://mapbox.com  
**API:** Mapbox Geocoding API v5  
**Plan:** Free tier (100,000 requests/month)  
**Commercial use:** Permitted on all plans.  
**Attribution:** Required — "Powered by Mapbox" must appear in the UI near any map or geocoding results.  
**Caching:** Geocoding results may be cached permanently (Mapbox Terms §4.3 — session-based restriction
applies to autocomplete, not to final resolved results stored in our database).  
**Rate limits:** Free tier: 100,000 requests/month. Paid: $0.75 per 1,000 after.

### Usage
Used for location search autocomplete and one-time coordinate resolution. Results are cached
permanently in the `locations` table — we do not re-geocode known locations.

---

## Authentication — Supabase Auth

**Website:** https://supabase.com  
**Plan:** Free tier (up to 50,000 MAU), then Pro ($25/month).  
**Licence:** Apache 2.0 (open source). Hosted service terms apply.  
**Data residency:** Configured to EU region.  
**GDPR:** Supabase is GDPR compliant; we are the data controller.

---

## Email — Resend

**Website:** https://resend.com  
**Plan:** Free tier (3,000 emails/month), Pro ($20/month for 50,000).  
**Licence:** Commercial SaaS — standard terms apply.  
**GDPR:** Resend processes email data as a data processor. DPA available.  
**Data residency:** EU region available.

---

## Analytics — PostHog

**Website:** https://posthog.com  
**Plan:** Free tier (1,000,000 events/month).  
**Licence:** MIT (open source). Hosted service terms apply.  
**GDPR:** PostHog is GDPR compliant. We use the EU-hosted instance (`eu.i.posthog.com`).
No cookie consent banner required for analytics-only PostHog use without cookies.

---

## Payments — Stripe (Phase 2)

**Website:** https://stripe.com  
**Licence:** Commercial SaaS.  
**Pricing:** 1.4% + 20p per UK card transaction. No monthly fee.  
**GDPR:** Stripe is GDPR compliant; acts as a data processor for payment data.
We do not store card details — Stripe handles tokenisation.

---

## Hosting — Vercel

**Website:** https://vercel.com  
**Plan:** Hobby (free) at launch, Pro ($20/month) when Cron jobs are needed.  
**Data residency:** Edge network (global); serverless functions in chosen region.

---

## Database — Supabase (PostgreSQL)

**Website:** https://supabase.com  
**Plan:** Free tier (500MB) at launch, Pro ($25/month) for production.  
**Engine:** PostgreSQL 15.  
**Data residency:** EU (Frankfurt) region.

---

*Last updated: 2026-08-18*
