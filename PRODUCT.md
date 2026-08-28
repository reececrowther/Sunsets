# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally:

- **Casual enthusiast** — someone who loves a good sunset and wants a quick verdict before deciding whether tonight is worth stepping outside. They have no meteorology knowledge and want a single trustworthy answer, not raw data to interpret.
- **Photographer / creative** — someone planning a shoot who needs precise timing (golden hour, blue hour), directional data (azimuth), and a full conditions breakdown. They reach for SunsetScore because it does the forecasting work they would otherwise do manually across multiple tools.

Both audiences are UK-based. The score serves casuals; the detailed breakdown serves power users. Neither is subordinate to the other.

## Product Purpose

SunsetScore tells you whether tonight's sunset will be spectacular, when to go outside, and where to go in the UK — expressed as a single 0–100 score backed by a full conditions breakdown.

Success for a casual user means knowing within seconds whether tonight is worth the effort. Success for a photographer means having every variable they need in one place, with enough confidence to plan a journey around it.

## Positioning

SunsetScore is the only tool that combines a single quality verdict (the score), UK-specific curated locations, and precise timing and directional data in one product. Weather apps give raw data; sunset time sites give times only; SunsetScore gives a decision. No neighbouring product can truthfully claim all three.

## Operating Context

- Users check the product in the hours before sunset, typically late afternoon.
- Casuals may check from a sofa, commute, or workplace — a quick glance to decide if tonight is worth it.
- Photographers may plan days ahead using the 7-day forecast, cross-referenced against specific locations.
- Weather is refreshed every 2 hours from the database; users never wait for a live fetch.
- The product is UK-only. All locations are UK-specific.

## Capabilities and Constraints

- Scoring engine: pure TypeScript, scores 0–100 from cloud layers (high, mid, low), rain probability, visibility, atmospheric conditions, and forecast confidence.
- Quality tiers: excellent (80+), great (60–79), good (40–59), fair (20–39), poor (<20).
- Data source: Open-Meteo (commercial tier) refreshed every 2 hours via Vercel Cron.
- Astronomical data: suncalc (zero API cost) — golden hour, blue hour, azimuth, solar noon.
- Free tier: 3-day horizon, no saved locations, no alerts, core score visible.
- Pro tier (£2.99/month): 7-day horizon, up to 999 saved locations, alerts, full score breakdown, forecast confidence, colour probability, azimuth, advanced cloud detail.
- Auth and payments are planned (Supabase Auth + Stripe) but not yet live; the product currently operates as free-tier only.
- Alerts, saved locations, and dashboard features are built in the data model but not yet exposed in the UI.

## Brand Commitments

- **Name:** Afterglow
- **Tagline:** "Is tonight's sky worth watching?"
- **Voice:** Poetic and atmospheric — leans into the beauty of sunsets with considered, evocative language. The writing earns its weight; no flourishes for their own sake.
- **Language rule:** plain English, no meteorology jargon in user-facing strings. "High cloud: Ideal" not "Cloud cover at 700 hPa".
- **Logo:** Horizon arc SVG — rising arc, horizon line, sun rays in warm gold (#F0B830). Wordmark in Bodoni Moda italic.
- **Typography:** Bodoni Moda (display, italic, high-contrast classical serif) + Work Sans (body) + JetBrains Mono (times/data).
- **Colour language:** Turner palette — warm umber (#0C0908) ground, amber (#C8701A) accent, gold (#F0B830) highlight. Quality-coded: gold for excellent, amber for great, green for good, slate for fair, dark umber for poor. No cold blue anywhere.

## Evidence on Hand

- Live scoring engine in `/lib/sunset-score/` with documented factor weights.
- Seeded UK location database (names, slugs, coordinates, regions, timezones).
- Email subscriber list in early growth (newsletter sign-up live on homepage).
- Quality-tier colour system confirmed in `/lib/quality.ts` and applied across all UI.
- No testimonials, press, or case studies exist yet — future work must not fabricate them.

## Product Principles

1. **One verdict, not a data dump.** The score is the product. Everything else supports it.
2. **Worth the journey, worth the wait.** Every forecast must be trustworthy enough to justify a physical trip. Accuracy and freshness are non-negotiable.
3. **The moment is the point.** Timing and location are first-class citizens — knowing the best spot tonight is as important as knowing the score.
4. **Beauty is the medium.** The interface should feel like looking at a sky, not reading a spreadsheet. Atmospheric design is not decoration; it is the product experience.
5. **Plain language earns trust.** If a casual user can't understand it without help, it's wrong.

## Accessibility & Inclusion

No product-specific requirement established. Standard WCAG 2.1 AA applies.
