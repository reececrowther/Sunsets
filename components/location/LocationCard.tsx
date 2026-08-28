import Link from 'next/link'
import type { Location, SunsetForecast, SunsetQuality } from '@/types'
import { formatTime } from '@/lib/utils/format'

const SCORE_COLORS: Record<SunsetQuality, string> = {
  excellent: '#F0B830',
  great:     '#C8701A',
  good:      '#5FAA88',
  fair:      '#8890B8',
  poor:      '#504840',
}

// Turner Sky thumbnail gradients — warm and painted, never clinical
const SKY_STRIP: Record<SunsetQuality, string> = {
  excellent: 'linear-gradient(160deg, #1A0808 0%, #5C1010 25%, #A83010 50%, #D06018 72%, #E89428 100%)',
  great:     'linear-gradient(160deg, #140808 0%, #3C1010 25%, #7A2810 50%, #AA4818 72%, #C87020 100%)',
  good:      'linear-gradient(160deg, #080E0C 0%, #0E2018 25%, #163A26 50%, #285A36 72%, #3E7848 100%)',
  fair:      'linear-gradient(160deg, #080A10 0%, #0E1220 25%, #181C30 50%, #202840 72%, #2A3450 100%)',
  poor:      'linear-gradient(160deg, #080608 0%, #0E0A0C 25%, #120E10 50%, #161214 72%, #181618 100%)',
}

function scoreColor(score: number): string {
  if (score >= 80) return '#F0B830'
  if (score >= 60) return '#C8701A'
  if (score >= 40) return '#5FAA88'
  return '#8890B8'
}

interface Props {
  location: Location
  forecast: SunsetForecast | null
}

export function LocationCard({ location, forecast }: Props) {
  const score   = forecast?.score   ?? null
  const quality = forecast?.quality ?? null
  const color   = quality ? SCORE_COLORS[quality] : (score !== null ? scoreColor(score) : '#2E1C10')

  return (
    <Link
      href={`/sunset/${location.slug}`}
      style={{ display: 'block', textDecoration: 'none', height: '100%' }}
    >
      <article
        style={{
          position: 'relative',
          background: '#18100A',
          border: '1px solid rgba(200,140,60,0.08)',
          borderRadius: '14px',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
        }}
        className="hover:border-[rgba(200,140,60,0.22)] hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
      >
        {/* Sky thumbnail strip */}
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            height: '68px',
            flexShrink: 0,
            background: quality
              ? SKY_STRIP[quality]
              : 'linear-gradient(160deg, #0C0808 0%, #120A08 100%)',
          }}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, #18100A 100%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Card content */}
        <div style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* Score + quality */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <div style={{
              fontSize: '2.9rem',
              fontFamily: 'var(--font-display, Georgia, serif)',
              fontStyle: 'italic',
              fontWeight: 700,
              color,
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}>
              {score !== null ? score : '—'}
            </div>
            {quality && (
              <span style={{
                fontSize: '0.58rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color,
                opacity: 0.75,
                marginTop: '6px',
              }}>
                {quality}
              </span>
            )}
          </div>

          {/* Location name */}
          <div style={{
            fontSize: '0.98rem',
            fontWeight: 500,
            color: '#EDE0C0',
            marginBottom: '3px',
            lineHeight: 1.3,
          }}>
            {location.name}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#5A4030',
            marginBottom: '16px',
          }}>
            {location.region ?? location.country}
          </div>

          {/* Sunset time */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: 'auto',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" opacity="0.55"/>
              <path d="M2 12h4M18 12h4M12 2v4M12 18v4" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
            </svg>
            <span style={{ fontSize: '0.78rem', color: '#5A4030', fontFamily: 'var(--font-mono)' }}>
              {forecast?.sunsetTime
                ? `Sunset ${formatTime(forecast.sunsetTime, location.timezone)}`
                : 'No forecast yet'
              }
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
