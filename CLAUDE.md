@AGENTS.md

# SunsetScore — Project Guide

## What this is
A sunset forecasting SaaS. The core product is: "Tell me whether tonight's sunset will be spectacular, when to go outside, and where."

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase (PostgreSQL + Auth), Vercel
- Open-Meteo (weather, commercial tier)
- suncalc (npm, astronomical calculations — zero API cost)
- Mapbox (geocoding)
- Resend (email), PostHog (analytics)

## Critical rules

**Scoring engine** — `/lib/sunset-score/` is a pure TypeScript module. No React, no database, no framework imports. It takes `SunsetScoreInput`, returns `SunsetScoreResult`. All algorithm changes happen here only.

**Caching** — weather is NEVER fetched during a user request. The Vercel Cron job refreshes all locations every 2 hours. Users read from the database. This controls API costs.

**Feature gates** — all free/Pro access control is in `/config/tiers.ts` only.

**Timezone** — always display times in the location's timezone using `formatTime(date, location.timezone)`. Never use the user's browser timezone for sunset times.

**Language** — plain English, no meteorology jargon in user-facing strings. "High cloud: Ideal" not "Cloud cover at 700 hPa".

## Running the project
```bash
npm run dev
npm run build
npm test
npx tsx scripts/seed-locations.ts
```

## Database
Apply `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor (or `supabase db push`).

## Phase
Phase 0 complete. Phase 1 next: scoring engine test run, API route integration testing.
