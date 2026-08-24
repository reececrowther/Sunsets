import Link from 'next/link'
import type { Location, SunsetForecast, SunsetQuality } from '@/types'
import { formatTime } from '@/lib/utils/format'

const SCORE_COLORS: Record<SunsetQuality, string> = {
  excellent: '#F5A828',
  great:     '#E07540',
  good:      '#5FAA88',
  fair:      '#7A8DB8',
  poor:      '#4A5872',
}

const SCORE_GLOWS: Record<SunsetQuality, string> = {
  excellent: 'rgba(245,168,40,0.15)',
  great:     'rgba(224,117,64,0.14)',
  good:      'rgba(95,170,136,0.12)',
  fair:      'rgba(122,141,184,0.10)',
  poor:      'rgba(74,88,114,0.08)',
}

function scoreColor(score: number): string {
  if (score >= 80) return '#F5A828'
  if (score >= 60) return '#E07540'
  if (score >= 40) return '#5FAA88'
  return '#7A8DB8'
}

interface Props {
  location: Location
  forecast: SunsetForecast | null
}

export function LocationCard({ location, forecast }: Props) {
  const score = forecast?.score ?? null
  const quality = forecast?.quality ?? null
  const color = quality ? SCORE_COLORS[quality] : (score !== null ? scoreColor(score) : '#1E2D48')
  const glow = quality ? SCORE_GLOWS[quality] : 'transparent'

  return (
    <Link
      href={`/sunset/${location.slug}`}
      style={{ display: 'block', textDecoration: 'none' }}
    >
      <article style={{
        position: 'relative',
        background: '#0e1424',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px',
        padding: '22px',
        height: '100%',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
      }}
        className="hover:border-[rgba(255,255,255,0.14)] hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        {/* Ambient score glow — top-right corner */}
        {score !== null && (
          <div aria-hidden="true" style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}

        {/* Score + quality */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: 800,
            color,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          }}>
            {score !== null ? score : '—'}
          </div>
          {quality && (
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color,
              opacity: 0.8,
              marginTop: '6px',
            }}>
              {quality}
            </span>
          )}
        </div>

        {/* Location name */}
        <div style={{
          fontSize: '0.98rem',
          fontWeight: 600,
          color: '#E8E2D4',
          marginBottom: '3px',
          lineHeight: 1.3,
        }}>
          {location.name}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#3D4E6A',
          marginBottom: '16px',
        }}>
          {location.region ?? location.country}
        </div>

        {/* Sunset time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" opacity="0.6"/>
            <path d="M2 12h4M18 12h4M12 2v4M12 18v4" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
          </svg>
          <span style={{ fontSize: '0.78rem', color: '#3D4E6A' }}>
            {forecast?.sunsetTime
              ? `Sunset ${formatTime(forecast.sunsetTime, location.timezone)}`
              : 'No forecast yet'
            }
          </span>
        </div>
      </article>
    </Link>
  )
}
