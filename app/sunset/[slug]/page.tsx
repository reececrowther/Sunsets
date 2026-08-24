import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocationBySlug } from '@/lib/database/locations'
import { getForecastsForLocation } from '@/lib/database/forecasts'
import { ScoreDisplay } from '@/components/ui/ScoreDisplay'
import { ForecastStrip } from '@/components/forecast/ForecastStrip'
import { ConditionsPanel } from '@/components/forecast/ConditionsPanel'
import { ViewingWindow } from '@/components/forecast/ViewingWindow'
import { BreakdownPanel } from '@/components/forecast/BreakdownPanel'
import { Nav } from '@/components/layout/Nav'
import { APP_NAME } from '@/config/brand'
import { formatDate, formatAzimuth } from '@/lib/utils/format'

export const revalidate = 7200

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const location = await getLocationBySlug(slug)
  if (!location) return {}
  return {
    title: `${location.name} Sunset Forecast — ${APP_NAME}`,
    description: `Is tonight's sunset in ${location.name} worth watching? Live 0–100 score, cloud breakdown, and exact viewing window.`,
  }
}


const QUALITY_DOT: Record<string, string> = {
  excellent: '#F5A828',
  great:     '#E07540',
  good:      '#5FAA88',
  fair:      '#7A8DB8',
  poor:      '#4A5872',
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params
  const location = await getLocationBySlug(slug)
  if (!location) notFound()

  const forecasts = await getForecastsForLocation(location.id, 7)
  const today = forecasts[0] ?? null
  const todayDate = new Date().toISOString().slice(0, 10)

  const hasForecast = today !== null && today.score !== null

  return (
    <>
      <Nav maxWidth="800px" />

      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 var(--px) 80px',
        width: '100%',
      }}>

        {/* ── Page header with atmospheric sky ── */}
        <div style={{
          position: 'relative',
          paddingTop: '96px',
          paddingBottom: hasForecast ? '32px' : '40px',
        }}>

          {/* Back link */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: '32px', position: 'relative' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem',
                color: '#3D4E6A',
                textDecoration: 'none',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All locations
            </Link>
          </nav>

          {/* Location heading */}
          <div style={{ position: 'relative' }}>
            <h1 className="font-display" style={{
              fontSize: 'clamp(2.4rem, 6vw, 3.6rem)',
              fontWeight: 900,
              fontStyle: 'italic',
              color: '#E8E2D4',
              letterSpacing: '-0.02em',
              lineHeight: 1.0,
              marginBottom: '6px',
            }}>
              {location.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {location.region && (
                <span style={{ fontSize: '0.83rem', color: '#3D4E6A' }}>{location.region}</span>
              )}
              {hasForecast && today && (
                <>
                  <span style={{ color: '#3D4E6A', fontSize: '0.72rem' }}>·</span>
                  <span style={{ fontSize: '0.72rem', color: '#3D4E6A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {formatDate(todayDate, location.timezone)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {hasForecast && today ? (
          <>
            {/* ── Score — no card, floats on page ── */}
            <section
              aria-label="Tonight's score"
              style={{
                padding: 'clamp(20px, 3vw, 36px) 0 clamp(24px, 4vw, 40px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <ScoreDisplay score={today.score!} quality={today.quality} size={220} />

              {/* Reasons */}
              {(today.reasons?.length ?? 0) > 0 && (
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxWidth: '360px',
                  width: '100%',
                }}>
                  {today.reasons!.map(r => (
                    <li key={r} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '9px',
                      fontSize: '0.83rem',
                      color: '#8A96B4',
                      lineHeight: 1.55,
                    }}>
                      <span aria-hidden="true" style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: QUALITY_DOT[today.quality ?? 'great'] ?? '#E07540',
                        marginTop: '9px',
                        flexShrink: 0,
                        opacity: 0.75,
                      }} />
                      {r}
                    </li>
                  ))}
                </ul>
              )}

              {/* Warnings */}
              {(today.warnings?.length ?? 0) > 0 && (
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '2px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxWidth: '360px',
                  width: '100%',
                }}>
                  {today.warnings!.map(w => (
                    <li key={w} style={{
                      fontSize: '0.78rem',
                      color: '#A87848',
                      lineHeight: 1.5,
                      borderLeft: '2px solid rgba(224,117,64,0.3)',
                      paddingLeft: '10px',
                    }}>
                      {w}
                    </li>
                  ))}
                </ul>
              )}

              {/* Direction chip */}
              {today.sunsetAzimuth != null && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '99px',
                  fontSize: '0.78rem',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: '#4A5872' }}>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{ color: '#4A5872' }}>Sunset faces</span>
                  <strong style={{ color: '#BDB8AE', fontWeight: 600, marginLeft: '1px' }}>{formatAzimuth(today.sunsetAzimuth)}</strong>
                </div>
              )}
            </section>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '28px' }} />

            {/* ── 7-day strip ── */}
            <section aria-label="7-day forecast" style={{ marginBottom: '28px' }}>
              <SectionLabel>7-day forecast</SectionLabel>
              <ForecastStrip
                forecasts={forecasts}
                timezone={location.timezone}
                todayDate={todayDate}
              />
            </section>

            {/* ── Viewing window ── */}
            {(today.goldenHourStart || today.sunsetTime || today.blueHourEnd) && (
              <Panel label="When to go outside" style={{ marginBottom: '12px' }}>
                <ViewingWindow forecast={today} timezone={location.timezone} />
              </Panel>
            )}

            {/* ── Conditions ── */}
            <Panel label="Conditions" style={{ marginBottom: '12px' }}>
              <ConditionsPanel forecast={today} />
            </Panel>

            {/* ── Score breakdown ── */}
            {today.scoreBreakdown && (
              <Panel label="Score breakdown" style={{ marginBottom: '12px' }}>
                <BreakdownPanel breakdown={today.scoreBreakdown} isPro={false} />
              </Panel>
            )}
          </>
        ) : (
          <div style={{
            padding: '80px 0',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '0.9rem', color: '#3D4E6A' }}>No forecast available yet. Check back soon.</p>
          </div>
        )}

        {/* ── Pro upsell ── */}
        <div style={{
          marginTop: '8px',
          padding: 'clamp(20px, 3vw, 32px) clamp(20px, 3vw, 28px)',
          background: 'linear-gradient(135deg, rgba(224,117,64,0.08) 0%, rgba(14,20,36,0.6) 100%)',
          border: '1px solid rgba(224,117,64,0.18)',
          borderRadius: '16px',
        }}>
          <div style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#E07540',
            marginBottom: '10px',
          }}>
            {APP_NAME} Pro
          </div>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#E8E2D4', margin: '0 0 14px', lineHeight: 1.3 }}>
            See exactly why tonight scores the way it does
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {['Full factor breakdown — cloud, atmosphere, visibility', 'Forecast confidence as the day approaches', 'Colour probability score', '7-day detailed forecast'].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: '#5A6A8A' }}>
                <span aria-hidden="true" style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#E07540', marginTop: '8px', flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>
          <div style={{ fontSize: '0.8rem', color: '#5A6A8A' }}>
            <strong style={{ color: '#C8C0B4', fontWeight: 600, fontSize: '1rem' }}>£2.99</strong>
            <span style={{ marginLeft: '5px' }}>/ month · Cancel anytime</span>
          </div>
        </div>

      </main>

      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '24px var(--px)',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span style={{ fontSize: '0.72rem', color: '#1E2D48' }}>
          Weather: Open-Meteo · Astronomy: suncalc
        </span>
        <Link href="/" style={{ fontSize: '0.72rem', color: '#1E2D48', textDecoration: 'none' }}>
          ← {APP_NAME}
        </Link>
      </footer>
    </>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color: '#3D4E6A',
      marginBottom: '14px',
    }}>
      {children}
    </h2>
  )
}

function Panel({
  label,
  children,
  style,
}: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <section
      aria-label={label}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 'clamp(18px, 3vw, 28px)',
        ...style,
      }}
    >
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  )
}
