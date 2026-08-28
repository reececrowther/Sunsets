import type { Metadata } from 'next'
import Link from 'next/link'
import { getFeaturedLocations } from '@/lib/database/locations'
import { getTodayForecastsForLocations, getForecastsForLocation } from '@/lib/database/forecasts'
import { LocationCard } from '@/components/location/LocationCard'
import { Nav } from '@/components/layout/Nav'
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/config/brand'
import { EmailSubscribeForm } from '@/components/email/EmailSubscribeForm'
import { UKHeatmap } from '@/components/ui/UKHeatmap'
import { HeroSection } from '@/components/hero/HeroSection'

export const revalidate = 7200

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
}

export default async function HomePage() {
  const locations   = await getFeaturedLocations()
  const forecastMap = await getTodayForecastsForLocations(locations.map(l => l.id))

  const sorted = [...locations].sort((a, b) => {
    const sa = forecastMap.get(a.id)?.score ?? -1
    const sb = forecastMap.get(b.id)?.score ?? -1
    return sb - sa
  })

  const scored   = sorted.filter(l => (forecastMap.get(l.id)?.score ?? null) !== null)
  const unscored = sorted.filter(l => (forecastMap.get(l.id)?.score ?? null) === null)
  const topId    = scored[0]?.id ?? null

  // Pre-fetch 7-day forecasts for all scored locations in parallel
  const weekEntries = await Promise.all(
    scored.map(async loc => {
      const fc = await getForecastsForLocation(loc.id, 7)
      return [loc.id, fc] as [string, typeof fc]
    })
  )
  const weekForecastsRecord = Object.fromEntries(weekEntries)

  // Serialise the Map → plain Record for the client component
  const forecastRecord = Object.fromEntries(
    [...forecastMap.entries()].filter(([, v]) => v !== undefined)
  ) as Record<string, NonNullable<ReturnType<typeof forecastMap.get>>>

  return (
    <>
      <Nav />

      {/* ── HERO ── */}
      <HeroSection
        locations={locations}
        forecastRecord={forecastRecord}
        weekForecastsRecord={weekForecastsRecord}
        topId={topId}
      />



      {/* ── LOCATIONS STRIP ── */}
      <section
        id="locations"
        aria-label="Tonight across the UK"
        style={{ background: '#0C0908', padding: 'clamp(40px, 5vw, 60px) 0 clamp(48px, 6vw, 72px)' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--px)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', fontWeight: 700, fontStyle: 'italic', color: '#EDE0C0', letterSpacing: '-0.01em', margin: 0 }}>
              Tonight across the UK
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#2E1C10', fontFamily: 'var(--font-mono)' }}>Updated every 2 hours</span>
          </div>

          {scored.length > 0 && (
            <div className="scrollbar-hide" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              {scored.map(loc => (
                <div key={loc.id} style={{ flexShrink: 0, width: '210px' }}>
                  <LocationCard location={loc} forecast={forecastMap.get(loc.id) ?? null} />
                </div>
              ))}
            </div>
          )}

          {unscored.length > 0 && (
            <div style={{ marginTop: '28px' }}>
              {scored.length > 0 && (
                <p style={{ fontSize: '0.68rem', color: '#2E1C10', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  More locations
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {unscored.map(loc => (
                  <Link
                    key={loc.id}
                    href={`/sunset/${loc.slug}`}
                    style={{ padding: '9px 14px', border: '1px solid rgba(200,140,60,0.08)', borderRadius: '8px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500, color: '#504840' }}
                  >
                    {loc.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#2E1C10', fontSize: '0.88rem', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
              No locations found. Run the seed script to populate UK locations.
            </div>
          )}
        </div>
      </section>

      {/* ── UK HEATMAP ── */}
      {scored.length > 0 && (
        <section
          aria-label="UK sunset map"
          style={{ background: '#0C0908', borderTop: '1px solid rgba(200,140,60,0.06)', padding: 'clamp(48px, 6vw, 72px) var(--px)' }}
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 'clamp(200px, 38vw, 300px)', flexShrink: 0 }}>
                <UKHeatmap
                  locations={sorted.map(loc => ({
                    id:        loc.id,
                    name:      loc.name,
                    slug:      loc.slug,
                    latitude:  loc.latitude,
                    longitude: loc.longitude,
                    score:     forecastMap.get(loc.id)?.score ?? null,
                    quality:   forecastMap.get(loc.id)?.quality ?? null,
                  }))}
                />
              </div>

              <div style={{ maxWidth: '300px' }}>
                <h2 className="font-display" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', fontWeight: 700, fontStyle: 'italic', color: '#EDE0C0', letterSpacing: '-0.01em', marginBottom: '20px' }}>
                  Where to watch tonight
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { quality: 'excellent', label: 'Excellent', color: '#F0B830' },
                    { quality: 'great',     label: 'Great',     color: '#C8701A' },
                    { quality: 'good',      label: 'Good',      color: '#5FAA88' },
                    { quality: 'fair',      label: 'Fair',      color: '#8890B8' },
                    { quality: 'poor',      label: 'Poor',      color: '#504840' },
                  ].map(({ quality, label, color }) => {
                    const count = scored.filter(l => forecastMap.get(l.id)?.quality === quality).length
                    if (count === 0) return null
                    return (
                      <div key={quality} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 5px 2px ${color}55` }} />
                        <span style={{ fontSize: '0.82rem', color: '#5A4030' }}>
                          {label}
                          <span style={{ color: '#2E1C10', marginLeft: '6px' }}>· {count} {count === 1 ? 'location' : 'locations'}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#2E1C10', lineHeight: 1.7, margin: 0 }}>
                  Scores update every two hours using real-time cloud and visibility data from Open-Meteo.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section
        aria-label="How it works"
        style={{ background: '#0C0908', borderTop: '1px solid rgba(200,140,60,0.06)', padding: 'clamp(48px, 6vw, 72px) var(--px)' }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', fontWeight: 700, fontStyle: 'italic', color: '#EDE0C0', letterSpacing: '-0.01em', marginBottom: '36px' }}>
            What goes into the score
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '36px' }}>
            {[
              { label: 'High cloud',  body: '35–70% coverage of thin cloud high up is the sweet spot. It catches and scatters sunlight into colour. Clear sky or thick cloud both produce muted sunsets.' },
              { label: 'Low cloud',   body: 'Even a thin band sitting on the western horizon will block the most important part of the show. We score this heavily.' },
              { label: 'Atmosphere', body: 'Dust, humidity, and aerosols scatter short wavelengths and push light toward deep reds and oranges. Some haze helps.' },
              { label: 'Visibility', body: 'Clear air lets colour travel further. We combine meteorological visibility with atmospheric transparency to estimate how far colours will reach.' },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8701A', marginBottom: '10px' }}>
                  {item.label}
                </div>
                <p style={{ fontSize: '0.84rem', color: '#5A4030', lineHeight: 1.75, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0C0908', borderTop: '1px solid rgba(200,140,60,0.06)', padding: '28px var(--px)' }}>
        <div
          style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}
          className="footer-inner"
        >
          <span style={{ fontSize: '0.72rem', color: '#2E1C10' }}>{APP_NAME} · UK sunset forecasting</span>
          <EmailSubscribeForm />
          <span style={{ fontSize: '0.72rem', color: '#2E1C10' }}>Weather: Open-Meteo · Astronomy: suncalc</span>
        </div>
      </footer>
    </>
  )
}
