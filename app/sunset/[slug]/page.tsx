import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocationBySlug } from '@/lib/database/locations'
import { getForecastsForLocation } from '@/lib/database/forecasts'
import { ForecastStrip } from '@/components/forecast/ForecastStrip'
import { ConditionsPanel } from '@/components/forecast/ConditionsPanel'
import { ViewingWindow } from '@/components/forecast/ViewingWindow'
import { BreakdownPanelGated } from '@/components/forecast/BreakdownPanelGated'
import { Nav } from '@/components/layout/Nav'
import { SunCompass } from '@/components/forecast/SunCompass'
import { WeekScoreChart } from '@/components/hero/WeekScoreChart'
import { APP_NAME } from '@/config/brand'
import { NotifyButton } from '@/components/ui/NotifyButton'
import { RatingWidget } from '@/components/forecast/RatingWidget'
import { AlertPanel } from '@/components/forecast/AlertPanel'
import { AuroraPanel } from '@/components/forecast/AuroraPanel'
import { NightConditions } from '@/components/forecast/NightConditions'
import { formatDate, formatTime } from '@/lib/utils/format'
import { getMoonData } from '@/lib/astronomy/moon'
import { getTideExtremes } from '@/lib/database/tides'

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

const SKY_IMAGE: Record<string, string> = {
  excellent: '/hero/sky-warm.png',
  great:     '/hero/sky-warm.png',
  good:      '/hero/sky-neutral.png',
  fair:      '/hero/sky-cool.png',
  poor:      '/hero/sky-cool.png',
  default:   '/hero/sky-cool.png',
}

const QUALITY_COLORS: Record<string, string> = {
  excellent: '#F0B830',
  great:     '#C8701A',
  good:      '#5FAA88',
  fair:      '#8890B8',
  poor:      '#504840',
}

const HERO_BG: Record<string, string> = {
  excellent: 'linear-gradient(to bottom, #0A0806 0%, #140C18 10%, #3C1010 24%, #7A2C14 40%, #B85018 56%, #D8801E 72%, #ECA828 86%, #F0B830 100%)',
  great:     'linear-gradient(to bottom, #0A0806 0%, #130E14 12%, #300E0C 26%, #68260E 44%, #9E4616 60%, #BE6E18 76%, #CE8820 90%, #D49226 100%)',
  good:      'linear-gradient(to bottom, #080A0C 0%, #0C1618 35%, #102828 58%, #183E2A 80%, #1E5035 100%)',
  fair:      'linear-gradient(to bottom, #080A0E 0%, #0C1020 55%, #141826 100%)',
  poor:      'linear-gradient(to bottom, #070608 0%, #0C0A0E 100%)',
  default:   'linear-gradient(to bottom, #0A0806 0%, #180E0A 50%, #0C0908 100%)',
}

// Quality-tinted horizon glow — adds atmospheric warmth behind the chart
const HORIZON_COLOR: Record<string, string> = {
  excellent: 'rgba(240,184,48,0.20)',
  great:     'rgba(200,112,26,0.20)',
  good:      'rgba(95,170,136,0.15)',
  fair:      'rgba(120,130,180,0.13)',
  poor:      'rgba(80,72,64,0.10)',
  default:   'rgba(200,112,26,0.16)',
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params
  const location = await getLocationBySlug(slug)
  if (!location) notFound()

  const forecasts  = await getForecastsForLocation(location.id, 7)
  const today      = forecasts[0] ?? null
  const todayDate  = new Date().toISOString().slice(0, 10)

  const moon  = getMoonData(new Date(), location.latitude, location.longitude)
  const tides = await getTideExtremes(location.id, todayDate)

  const hasForecast   = today !== null && today.score !== null
  const quality       = today?.quality ?? 'default'
  const scoreColor    = QUALITY_COLORS[quality] ?? '#C8701A'
  const heroBg        = HERO_BG[quality] ?? HERO_BG.default
  const skyImage      = SKY_IMAGE[quality] ?? SKY_IMAGE.default
  const horizonColor  = HORIZON_COLOR[quality] ?? HORIZON_COLOR.default

  return (
    <>
      <Nav />

      {/* ── Atmospheric hero ── */}
      <section
        aria-label={`${location.name} sunset forecast`}
        className="grain"
        style={{
          position:      'relative',
          minHeight:     '100svh',
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'center',
          overflow:      'hidden',
          background:    '#0C0908',
          paddingTop:    'max(80px, 10vh)',   // clear fixed nav (60px) with breathing room
          paddingBottom: 'max(120px, 15vw)', // reserve space for chart at any screen width
        }}
      >
        {/* Cloud photo — base layer */}
        <Image
          src={skyImage}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center top', zIndex: 0 }}
        />

        {/* Quality colour grade */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: heroBg,
          opacity: 0.38,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Horizon atmospheric glow */}
        <div aria-hidden="true" style={{
          position:   'absolute',
          bottom: 0, left: 0, right: 0,
          height:     '60%',
          background: `radial-gradient(ellipse 90% 65% at 50% 100%, ${horizonColor} 0%, transparent 70%)`,
          zIndex:     2,
          pointerEvents: 'none',
        }} />

        {/* Top fade — nav legibility */}
        <div aria-hidden="true" style={{
          position:   'absolute',
          top: 0, left: 0, right: 0,
          height:     '180px',
          background: 'linear-gradient(to bottom, rgba(8,6,4,0.80) 0%, transparent 100%)',
          zIndex:     3,
          pointerEvents: 'none',
        }} />

        {/* Bottom fade — dissolves into below-fold */}
        <div aria-hidden="true" style={{
          position:   'absolute',
          bottom: 0, left: 0, right: 0,
          height:     '55%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(8,6,4,0.50) 38%, rgba(8,6,4,0.88) 68%, #0C0908 100%)',
          zIndex:     4,
          pointerEvents: 'none',
        }} />

        {/* Radial vignette — legibility behind the score */}
        <div aria-hidden="true" style={{
          position:   'absolute', inset: 0,
          background: 'radial-gradient(ellipse 65% 70% at 50% 48%, rgba(4,3,2,0.68) 0%, rgba(4,3,2,0.28) 52%, transparent 80%)',
          zIndex:     5,
          pointerEvents: 'none',
        }} />

        {/* Hero content */}
        <div style={{
          position:        'relative',
          zIndex:          10,
          textAlign:       'center',
          padding:         '0 var(--px)',
          maxWidth:        '640px',
          width:           '100%',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          gap:             '18px',
        }}>

          {/* Location name */}
          <div>
            <h1 style={{
              fontSize:      'clamp(2.6rem, 7vw, 4.8rem)',
              fontFamily:    'var(--font-display, Georgia, serif)',
              fontStyle:     'italic',
              fontWeight:    900,
              color:         '#EDE0C0',
              letterSpacing: '-0.028em',
              lineHeight:    0.92,
              margin:        '0 0 14px',
              textShadow:    '0 2px 28px rgba(4,3,2,0.65)',
            }}>
              {location.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {location.region && (
                <span style={{ fontSize: '0.76rem', letterSpacing: '0.07em', color: 'rgba(237,224,192,0.34)' }}>
                  {location.region}
                </span>
              )}
              {hasForecast && today && (
                <>
                  <span aria-hidden="true" style={{ color: 'rgba(237,224,192,0.16)' }}>·</span>
                  <span style={{ fontSize: '0.70rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(237,224,192,0.30)' }}>
                    {formatDate(todayDate, location.timezone)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Score */}
          {hasForecast && today && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                fontSize:      'clamp(96px, 16vw, 200px)',
                fontFamily:    'var(--font-display, Georgia, serif)',
                fontStyle:     'italic',
                fontWeight:    700,
                color:         scoreColor,
                lineHeight:    0.88,
                letterSpacing: '-0.04em',
                textShadow:    `0 0 80px ${scoreColor}44, 0 2px 16px rgba(4,3,2,0.55)`,
              }}>
                {today.score}
              </div>
              {today.quality && (
                <div style={{
                  fontSize:      '0.64rem',
                  fontWeight:    600,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color:         scoreColor,
                  opacity:       0.72,
                }}>
                  {today.quality}
                </div>
              )}
            </div>
          )}

          {/* Atmospheric quote */}
          {hasForecast && today && (today.reasons?.length ?? 0) > 0 && (
            <p style={{
              fontSize:   'clamp(0.84rem, 1.1vw, 0.96rem)',
              fontFamily: 'var(--font-display, Georgia, serif)',
              fontStyle:  'italic',
              color:      'rgba(237,224,192,0.82)',
              lineHeight: 1.65,
              margin:     0,
              maxWidth:   '360px',
              textShadow: '0 1px 12px rgba(4,3,2,0.85), 0 2px 4px rgba(4,3,2,0.6)',
            }}>
              &ldquo;{today.reasons![0]}.&rdquo;
            </p>
          )}

          {/* Times row */}
          {hasForecast && today && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
              {([
                { label: 'Golden Hour', time: today.goldenHourStart },
                { label: 'Sunset',      time: today.sunsetTime      },
                { label: 'Blue Hour',   time: today.blueHourEnd     },
              ] as { label: string; time: string | null }[])
                .filter(t => t.time)
                .map((t, i, arr) => (
                  <div key={t.label} style={{
                    paddingRight: i < arr.length - 1 ? '24px' : 0,
                    marginRight:  i < arr.length - 1 ? '24px' : 0,
                    borderRight:  i < arr.length - 1 ? '1px solid rgba(200,140,60,0.14)' : 'none',
                    textAlign:    'center',
                  }}>
                    <div style={{
                      fontSize:      '0.54rem',
                      fontWeight:    600,
                      letterSpacing: '0.17em',
                      textTransform: 'uppercase',
                      color:         'rgba(237,224,192,0.48)',
                      marginBottom:  '5px',
                      textShadow:    '0 1px 8px rgba(4,3,2,0.80)',
                    }}>
                      {t.label}
                    </div>
                    <div style={{
                      fontSize:      'clamp(0.88rem, 1.1vw, 1.02rem)',
                      fontWeight:    500,
                      fontFamily:    'var(--font-mono, ui-monospace, monospace)',
                      letterSpacing: '0.04em',
                      color:         '#EDE0C0',
                      textShadow:    '0 1px 8px rgba(4,3,2,0.70)',
                    }}>
                      {formatTime(t.time!, location.timezone)}
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {!hasForecast && (
            <p style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'rgba(237,224,192,0.30)' }}>
              No forecast data yet — check back soon.
            </p>
          )}
        </div>

        {/* 7-day score chart — pinned to hero bottom */}
        {forecasts.length > 0 && (
          <div className="hero-chart-wrap">
            <WeekScoreChart forecasts={forecasts} />
          </div>
        )}
      </section>

      {/* ── Below-fold ── */}
      <main style={{
        maxWidth: '800px',
        margin:   '0 auto',
        padding:  '40px var(--px) 80px',
        width:    '100%',
      }}>

        <nav aria-label="Breadcrumb" style={{ marginBottom: '36px' }}>
          <Link href="/" style={{
            display:     'inline-flex',
            alignItems:  'center',
            gap:         '5px',
            fontSize:    '0.78rem',
            color:       '#5A4030',
            textDecoration: 'none',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All locations
          </Link>
        </nav>

        {hasForecast && today ? (
          <>
            {/* Warnings */}
            {(today.warnings?.length ?? 0) > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {today.warnings!.map(w => (
                  <li key={w} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.80rem', color: '#9A8060', lineHeight: 1.55 }}>
                    <span aria-hidden="true" style={{
                      display:      'inline-block',
                      width:        '4px',
                      height:       '4px',
                      borderRadius: '50%',
                      background:   'rgba(200,112,26,0.55)',
                      flexShrink:   0,
                      marginTop:    '7px',
                    }} />
                    {w}
                  </li>
                ))}
              </ul>
            )}

            {/* Sunset azimuth compass */}
            {today.sunsetAzimuth != null && (
              <div style={{ marginBottom: '32px' }}>
                <SunCompass azimuth={today.sunsetAzimuth} quality={today.quality} size={160} />
              </div>
            )}

            {/* 7-day strip */}
            <section aria-label="7-day forecast" style={{ marginBottom: '28px' }}>
              <SectionLabel>7-day forecast</SectionLabel>
              <ForecastStrip forecasts={forecasts} timezone={location.timezone} todayDate={todayDate} />
            </section>

            {/* Viewing window */}
            {(today.goldenHourStart || today.sunsetTime || today.blueHourEnd) && (
              <Panel label="When to go outside" style={{ marginBottom: '12px' }}>
                <ViewingWindow forecast={today} timezone={location.timezone} />
              </Panel>
            )}

            {/* Conditions */}
            <Panel label="Conditions" style={{ marginBottom: '12px' }}>
              <ConditionsPanel forecast={today} />
            </Panel>

            {/* Sky tonight — moon, atmosphere, tides */}
            <Panel label="Sky tonight" style={{ marginBottom: '12px' }}>
              <NightConditions
                moon={moon}
                forecast={today}
                tides={tides}
                timezone={location.timezone}
                date={todayDate}
              />
            </Panel>

            {/* Score breakdown */}
            {today.scoreBreakdown && (
              <Panel label="Score breakdown" style={{ marginBottom: '12px' }}>
                <BreakdownPanelGated breakdown={today.scoreBreakdown} />
              </Panel>
            )}

            {/* Community rating — only for today and past dates */}
            {today.forecastDate <= todayDate && (
              <Panel label="Rate this sunset" style={{ marginBottom: '12px' }}>
                <RatingWidget
                  locationId={location.id}
                  forecastDate={today.forecastDate}
                />
              </Panel>
            )}

            {/* Northern lights forecast */}
            <Panel label="Northern lights tonight" style={{ marginBottom: '12px' }}>
              <AuroraPanel
                locationId={location.id}
                timezone={location.timezone}
                latitude={location.latitude}
              />
            </Panel>

            {/* Alert panel — client-side auth check */}
            <Panel label="Sunset alerts" style={{ marginBottom: '12px' }}>
              <AlertPanel locationId={location.id} locationName={location.name} />
            </Panel>
          </>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: '#5A4030' }}>No forecast available yet. Check back soon.</p>
          </div>
        )}

        {/* Pro upsell */}
        <div style={{
          marginTop:  '8px',
          padding:    'clamp(20px, 3vw, 32px) clamp(20px, 3vw, 28px)',
          background: 'linear-gradient(135deg, rgba(200,112,26,0.08) 0%, rgba(12,9,8,0.6) 100%)',
          border:     '1px solid rgba(200,112,26,0.18)',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8701A', marginBottom: '10px' }}>
            {APP_NAME} Pro
          </div>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#EDE0C0', margin: '0 0 14px', lineHeight: 1.3 }}>
            See exactly why tonight scores the way it does
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              'Full factor breakdown — cloud, atmosphere, visibility',
              'Forecast confidence as the day approaches',
              'Colour probability score',
              '7-day detailed forecast',
            ].map(f => (
              <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: '#5A4030' }}>
                <span aria-hidden="true" style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#C8701A', marginTop: '8px', flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>
          <div style={{ fontSize: '0.8rem', color: '#5A4030', marginBottom: '18px' }}>
            <strong style={{ color: '#EDE0C0', fontWeight: 600, fontSize: '1rem' }}>£2.99</strong>
            <span style={{ marginLeft: '5px' }}>/ month · Cancel anytime</span>
          </div>
          <NotifyButton style={{
            display:      'block',
            width:        '100%',
            background:   'linear-gradient(135deg, #C8701A 0%, #E8902A 100%)',
            border:       'none',
            borderRadius: '10px',
            padding:      '13px 20px',
            fontSize:     '0.88rem',
            fontWeight:   700,
            color:        '#fff',
            letterSpacing: '0.01em',
            fontFamily:   'var(--font-sans, system-ui)',
            textAlign:    'center',
          }}>
            Join the launch list
          </NotifyButton>
        </div>
      </main>

      <footer style={{
        borderTop:     '1px solid rgba(200,140,60,0.06)',
        padding:       '24px var(--px)',
        maxWidth:      '800px',
        margin:        '0 auto',
        width:         '100%',
        display:       'flex',
        justifyContent: 'space-between',
        alignItems:    'center',
        flexWrap:      'wrap',
        gap:           '8px',
      }}>
        <span style={{ fontSize: '0.72rem', color: '#2E1C10' }}>
          Weather: MET Norway · Astronomy: suncalc{tides ? ' · Tides: WorldTides' : ''}
        </span>
        <Link href="/" style={{ fontSize: '0.72rem', color: '#5A4030', textDecoration: 'none' }}>
          ← {APP_NAME}
        </Link>
      </footer>
    </>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize:      '0.65rem',
      fontWeight:    700,
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color:         '#5A4030',
      marginBottom:  '14px',
    }}>
      {children}
    </h2>
  )
}

function Panel({ label, children, style }: {
  label:    string
  children: React.ReactNode
  style?:   React.CSSProperties
}) {
  return (
    <section
      aria-label={label}
      style={{
        background:   'var(--surface)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding:      'clamp(18px, 3vw, 28px)',
        ...style,
      }}
    >
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  )
}
