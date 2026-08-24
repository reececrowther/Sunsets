import type { Metadata } from 'next'
import Link from 'next/link'
import { getFeaturedLocations } from '@/lib/database/locations'
import { getTodayForecastsForLocations } from '@/lib/database/forecasts'
import { LocationCard } from '@/components/location/LocationCard'
import { LocationSearch } from '@/components/location/LocationSearch'
import { Nav } from '@/components/layout/Nav'
import { SunScene } from '@/components/hero/SunScene'
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION } from '@/config/brand'
import { EmailSubscribeForm } from '@/components/email/EmailSubscribeForm'

export const revalidate = 7200

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
}

const SCORE_COLORS: Record<string, string> = {
  excellent: '#F5A828',
  great:     '#E07540',
  good:      '#5FAA88',
  fair:      '#7A8DB8',
  poor:      '#4A5872',
}

export default async function HomePage() {
  const locations = await getFeaturedLocations()
  const forecastMap = await getTodayForecastsForLocations(locations.map(l => l.id))

  const sorted = [...locations].sort((a, b) => {
    const sa = forecastMap.get(a.id)?.score ?? -1
    const sb = forecastMap.get(b.id)?.score ?? -1
    return sb - sa
  })

  // Top scored location for the hero pill
  const topLocation = sorted.find(l => (forecastMap.get(l.id)?.score ?? -1) >= 0) ?? null
  const topForecast = topLocation ? forecastMap.get(topLocation.id) ?? null : null

  const scored = sorted.filter(l => (forecastMap.get(l.id)?.score ?? null) !== null)
  const unscored = sorted.filter(l => (forecastMap.get(l.id)?.score ?? null) === null)

  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section
        aria-label="Hero"
        className="grain"
        style={{
          position: 'relative',
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: '#07091a',
        }}
      >
        {/* Dynamic sky — real-time solar position, gradient, stars */}
        <SunScene />

        {/* Top fade for nav legibility */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '160px',
          background: 'linear-gradient(to bottom, rgba(7,9,26,0.75) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Bottom fade — blends hero into the ground colour so the scroll is seamless.
            z=60 sits above the sun (z=55) so the disc fades behind the horizon. */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '50%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(8,12,24,0.6) 35%, rgba(8,12,24,0.88) 65%, #080c18 100%)',
          pointerEvents: 'none',
          zIndex: 60,
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative',
          zIndex: 65,
          textAlign: 'center',
          padding: '0 var(--px)',
          maxWidth: '660px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
        }}>

          {/* Tonight's top pick — only shown when data exists */}
          {topForecast && topLocation && (
            <Link
              href={`/sunset/${topLocation.slug}`}
              className="top-pick-pill"
              aria-label={`Tonight's best: ${topLocation.name}, score ${topForecast.score}`}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 900,
                color: SCORE_COLORS[topForecast.quality ?? 'great'] ?? '#E07540',
                letterSpacing: '-0.03em',
                flexShrink: 0,
              }}>
                {topForecast.score}
              </span>
              <span style={{ fontSize: '0.83rem', color: 'rgba(248,236,204,0.75)', fontWeight: 400 }}>
                Tonight in <strong style={{ color: '#F5EDD8', fontWeight: 600 }}>{topLocation.name}</strong>
                {topForecast.quality && (
                  <> · <span style={{ color: SCORE_COLORS[topForecast.quality] }}>{topForecast.quality}</span></>
                )}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ opacity: 0.4, flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" stroke="#F5EDD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}

          {/* Headline */}
          <h1 className="font-display" style={{
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 900,
            fontStyle: 'italic',
            color: '#F5EDD8',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Will tonight&apos;s sunset be worth chasing?
          </h1>

          {/* Subline */}
          <p style={{
            fontSize: 'clamp(0.88rem, 1.8vw, 1rem)',
            color: 'rgba(245,224,190,0.6)',
            lineHeight: 1.65,
            maxWidth: '400px',
            margin: 0,
          }}>
            A 0–100 score for every UK sunset — based on cloud layers, atmosphere, and visibility.
          </p>

          {/* Search */}
          <div style={{ width: '100%', maxWidth: '460px' }}>
            <LocationSearch locations={locations} />
          </div>
        </div>

        {/* Scroll cue */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          bottom: '28px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
          opacity: 0.3,
          zIndex: 65,
        }}>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F5EDD8' }}>
            All locations
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12l7 7 7-7" stroke="#F5EDD8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* ── Location grid ── */}
      <section
        aria-label="Locations"
        style={{
          background: '#080c18',
          padding: 'clamp(40px, 5vw, 64px) var(--px) clamp(64px, 8vw, 96px)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <h2 className="font-display" style={{
              fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#E8E2D4',
              letterSpacing: '-0.01em',
              margin: 0,
            }}>
              Tonight across the UK
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#1E2D48' }}>
              Updated every 2 hours
            </span>
          </div>

          {/* Scored locations */}
          {scored.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
              gap: '14px',
              marginBottom: unscored.length > 0 ? '40px' : '0',
            }}>
              {scored.map(loc => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  forecast={forecastMap.get(loc.id) ?? null}
                />
              ))}
            </div>
          )}

          {/* Unscored locations — minimal list */}
          {unscored.length > 0 && (
            <div>
              {scored.length > 0 && (
                <p style={{ fontSize: '0.7rem', color: '#1E2D48', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  More locations
                </p>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))',
                gap: '8px',
              }}>
                {unscored.map(loc => (
                  <Link
                    key={loc.id}
                    href={`/sunset/${loc.slug}`}
                    style={{
                      display: 'block',
                      padding: '14px 16px',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      transition: 'border-color 0.15s',
                    }}
                    className="hover:border-[rgba(255,255,255,0.09)]"
                  >
                    <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#4A5872' }}>
                      {loc.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#1E2D48', marginTop: '2px' }}>
                      {loc.region ?? loc.country}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#1E2D48', fontSize: '0.9rem' }}>
              No locations found. Run the seed script to populate UK locations.
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        aria-label="How it works"
        style={{
          background: '#080c18',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: 'clamp(48px, 6vw, 80px) var(--px)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 className="font-display" style={{
            fontSize: 'clamp(1.3rem, 2.5vw, 1.6rem)',
            fontWeight: 700,
            fontStyle: 'italic',
            color: '#E8E2D4',
            letterSpacing: '-0.01em',
            marginBottom: '40px',
          }}>
            What goes into the score
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
            gap: '40px',
          }}>
            {[
              {
                label: 'High cloud',
                body: '35–70% coverage of thin cloud high up is the sweet spot. It catches and scatters the sunlight into colour. Clear sky or thick cloud both produce muted sunsets.',
              },
              {
                label: 'Low cloud',
                body: 'Even a thin band of low cloud sitting on the western horizon will block the most important part of the show. We score this heavily.',
              },
              {
                label: 'Atmosphere',
                body: 'Dust, humidity, and aerosols in the lower atmosphere scatter short wavelengths and push light toward deep reds and oranges. Some haze helps.',
              },
              {
                label: 'Visibility',
                body: 'Clear air lets colour travel further across the sky. We combine meteorological visibility with atmospheric transparency to estimate how far the colours will reach.',
              },
            ].map(item => (
              <div key={item.label}>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#E07540',
                  marginBottom: '12px',
                }}>
                  {item.label}
                </div>
                <p style={{
                  fontSize: '0.85rem',
                  color: '#3D4E6A',
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: '#080c18',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '28px var(--px)',
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
          className="footer-inner"
        >
          <span style={{ fontSize: '0.72rem', color: '#1E2D48' }}>
            {APP_NAME} · UK sunset forecasting
          </span>
          <EmailSubscribeForm />
          <span style={{ fontSize: '0.72rem', color: '#1E2D48' }}>
            Weather: Open-Meteo · Astronomy: suncalc
          </span>
        </div>
      </footer>
    </>
  )
}
