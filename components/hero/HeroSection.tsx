'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Location, SunsetForecast } from '@/types'
import { LocationSearch } from '@/components/location/LocationSearch'
import { WeekScoreChart } from './WeekScoreChart'
import { formatDate, formatTime } from '@/lib/utils/format'

// ── Palette maps ─────────────────────────────────────────────────────────────

const SKY_IMAGE: Record<string, string> = {
  excellent: '/hero/sky-warm.png',
  great:     '/hero/sky-warm.png',
  good:      '/hero/sky-neutral.png',
  fair:      '/hero/sky-cool.png',
  poor:      '/hero/sky-cool.png',
  default:   '/hero/sky-cool.png',
}

const SCORE_COLORS: Record<string, string> = {
  excellent: '#F0B830',
  great:     '#C8701A',
  good:      '#5FAA88',
  fair:      '#8890B8',
  poor:      '#504840',
}

const HERO_BG: Record<string, string> = {
  excellent: `linear-gradient(to bottom,
    #0A0806 0%, #140C18 10%, #3C1010 24%, #7A2C14 40%,
    #B85018 56%, #D8801E 72%, #ECA828 86%, #F0B830 100%)`,
  great: `linear-gradient(to bottom,
    #0A0806 0%, #130E14 12%, #300E0C 26%, #68260E 44%,
    #9E4616 60%, #BE6E18 76%, #CE8820 90%, #D49226 100%)`,
  good: `linear-gradient(to bottom,
    #080A0C 0%, #0C1618 35%, #102828 58%, #183E2A 80%, #1E5035 100%)`,
  fair: `linear-gradient(to bottom,
    #080A0E 0%, #0C1020 55%, #141826 100%)`,
  poor: `linear-gradient(to bottom,
    #070608 0%, #0C0A0E 100%)`,
  default: `linear-gradient(to bottom,
    #0A0806 0%, #180E0A 50%, #0C0908 100%)`,
}

const CONDITION_COLOR = { good: '#5FAA88', neutral: '#8890B8', bad: '#B04038' } as const

// ── Conditions helper ─────────────────────────────────────────────────────────

type CondOk = 'good' | 'neutral' | 'bad'

function buildConditions(f: SunsetForecast) {
  return [
    {
      label: 'High cloud',
      value: f.cloudHigh != null ? `${Math.round(f.cloudHigh)}%` : '—',
      note:  f.cloudHigh != null && f.cloudHigh >= 35 && f.cloudHigh <= 70
               ? 'Ideal for colour'
               : f.cloudHigh != null && f.cloudHigh > 70 ? 'Too thick' : 'Sparse',
      ok:    (f.cloudHigh != null && f.cloudHigh >= 35 && f.cloudHigh <= 70
               ? 'good' : 'neutral') as CondOk,
    },
    {
      label: 'Low cloud',
      value: f.cloudLow != null ? `${Math.round(f.cloudLow)}%` : '—',
      note:  f.cloudLow != null && f.cloudLow <= 15
               ? 'Clear horizon'
               : f.cloudLow != null && f.cloudLow <= 40 ? 'Mostly clear' : 'Obstructing',
      ok:    (f.cloudLow != null && f.cloudLow <= 15
               ? 'good'
               : f.cloudLow != null && f.cloudLow > 55 ? 'bad' : 'neutral') as CondOk,
    },
    {
      label: 'Rain chance',
      value: f.rainProbability != null ? `${Math.round(f.rainProbability)}%` : '—',
      note:  f.rainProbability != null && f.rainProbability <= 15
               ? 'Minimal'
               : f.rainProbability != null && f.rainProbability <= 35 ? 'Low' : 'Significant',
      ok:    (f.rainProbability != null && f.rainProbability <= 15
               ? 'good'
               : f.rainProbability != null && f.rainProbability > 40 ? 'bad' : 'neutral') as CondOk,
    },
    {
      label: 'Visibility',
      value: f.visibility != null
               ? f.visibility >= 1000 ? `${(f.visibility / 1000).toFixed(0)}km` : `${f.visibility}m`
               : '—',
      note:  f.visibility != null && f.visibility >= 15000
               ? 'Excellent'
               : f.visibility != null && f.visibility >= 7000 ? 'Good' : 'Reduced',
      ok:    (f.visibility != null && f.visibility >= 10000
               ? 'good'
               : f.visibility != null && f.visibility < 3000 ? 'bad' : 'neutral') as CondOk,
    },
  ]
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  locations:           Location[]
  forecastRecord:      Record<string, SunsetForecast>
  weekForecastsRecord: Record<string, SunsetForecast[]>
  topId:               string | null
}

// ── Component ────────────────────────────────────────────────────────────────

export function HeroSection({ locations, forecastRecord, weekForecastsRecord, topId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(topId)
  const [favourites, setFavourites] = useState<string[]>([])
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  // Hydrate favourites from localStorage and potentially override selectedId
  useEffect(() => {
    try {
      const raw = localStorage.getItem('afterglow:favourites')
      if (raw) {
        const ids: string[] = JSON.parse(raw)
        setFavourites(ids)
        const favWithData = ids.find(id => forecastRecord[id]?.score != null)
        if (favWithData) setSelectedId(favWithData)
      }
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mobile sheet — body scroll lock
  useEffect(() => {
    if (!mobileSheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [mobileSheetOpen])

  // Mobile sheet — Escape key
  useEffect(() => {
    if (!mobileSheetOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileSheetOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileSheetOpen])

  const toggleFavourite = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setFavourites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      try { localStorage.setItem('afterglow:favourites', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // ── Derived display state ─────────────────────────────────────────────────
  const scored = useMemo(() =>
    locations
      .filter(l => forecastRecord[l.id]?.score != null)
      .sort((a, b) => (forecastRecord[b.id]?.score ?? -1) - (forecastRecord[a.id]?.score ?? -1)),
    [locations, forecastRecord]
  )

  const favLocations = useMemo(() =>
    favourites.map(id => locations.find(l => l.id === id)).filter(Boolean) as Location[],
    [favourites, locations]
  )

  const selectedLoc = locations.find(l => l.id === selectedId) ?? null
  const selectedFc  = selectedId ? (forecastRecord[selectedId] ?? null) : null
  const weekFc      = selectedId ? (weekForecastsRecord[selectedId] ?? []) : []
  const tz          = selectedLoc?.timezone ?? 'Europe/London'

  const scoreColor = selectedFc?.quality ? (SCORE_COLORS[selectedFc.quality] ?? '#C8701A') : '#C8701A'
  const heroBg     = HERO_BG[selectedFc?.quality ?? 'default'] ?? HERO_BG.default
  const skyImage   = SKY_IMAGE[selectedFc?.quality ?? 'default'] ?? SKY_IMAGE.default
  const conditions = selectedFc ? buildConditions(selectedFc) : []

  // ── Sidebar row renderer ──────────────────────────────────────────────────
  function SidebarRow({ loc, onSelect }: { loc: Location; onSelect?: () => void }) {
    const fc         = forecastRecord[loc.id] ?? null
    const sc         = fc?.score ?? null
    const ql         = fc?.quality ?? null
    const col        = ql ? (SCORE_COLORS[ql] ?? '#5A4030') : '#5A4030'
    const isSelected = loc.id === selectedId
    const isFav      = favourites.includes(loc.id)

    return (
      <div
        key={loc.id}
        style={{
          display:      'flex',
          alignItems:   'center',
          borderRadius: '10px',
          background:   isSelected ? 'rgba(200,112,26,0.09)' : 'transparent',
          transition:   'background 0.15s',
        }}
      >
        {/* Main select button */}
        <button
          onClick={() => { setSelectedId(loc.id); onSelect?.() }}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '10px',
            flex:           1,
            padding:        '8px 4px 8px 10px',
            background:     'none',
            border:         'none',
            cursor:         'pointer',
            textAlign:      'left',
            borderRadius:   '10px 0 0 10px',
            minWidth:       0,
          }}
        >
          {/* Score badge */}
          <span style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           '34px',
            height:          '34px',
            borderRadius:    '8px',
            background:      `${col}14`,
            border:          `1px solid ${col}26`,
            fontSize:        '0.78rem',
            fontWeight:      700,
            color:           col,
            letterSpacing:   '-0.02em',
            flexShrink:      0,
            fontFamily:      'var(--font-mono)',
          }}>
            {sc ?? '—'}
          </span>

          {/* Name + sunset time */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize:     '0.83rem',
              fontWeight:   isSelected ? 600 : 400,
              color:        isSelected ? '#EDE0C0' : '#9A8060',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
              lineHeight:   1.2,
            }}>
              {loc.name}
            </div>
            {fc?.sunsetTime && (
              <div style={{ fontSize: '0.67rem', color: '#5A4030', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {formatTime(fc.sunsetTime, loc.timezone)}
              </div>
            )}
          </div>

          {/* Quality dot */}
          {ql && (
            <span style={{
              width:        '5px',
              height:       '5px',
              borderRadius: '50%',
              background:   col,
              flexShrink:   0,
              boxShadow:    `0 0 4px 1px ${col}55`,
            }} />
          )}
        </button>

        {/* Favourite star */}
        <button
          onClick={e => toggleFavourite(e, loc.id)}
          aria-label={isFav ? `Remove ${loc.name} from favourites` : `Add ${loc.name} to favourites`}
          style={{
            padding:      '8px 10px',
            background:   'none',
            border:       'none',
            cursor:       'pointer',
            color:        isFav ? '#F0B830' : 'rgba(90,64,48,0.5)',
            fontSize:     '0.88rem',
            lineHeight:   1,
            borderRadius: '0 10px 10px 0',
            transition:   'color 0.15s',
            flexShrink:   0,
          }}
        >
          {isFav ? '★' : '☆'}
        </button>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section
      aria-label="Tonight's sunset"
      className="grain"
      style={{
        position:  'relative',
        height:    '100svh',
        minHeight: '640px',
        overflow:  'hidden',
        background: '#0C0908',
      }}
    >
      {/* Sky photograph */}
      <Image
        key={skyImage}
        src={skyImage}
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center top', zIndex: 0 }}
      />


      {/* Horizon glow */}
      <div
        aria-hidden="true"
        style={{
          position:  'absolute',
          bottom:    '14%',
          left:      '50%',
          transform: 'translateX(-50%)',
          width:     '80%',
          height:    '30%',
          background: `radial-gradient(ellipse 80% 55% at 50% 100%,
            ${scoreColor}20 0%,
            ${scoreColor}0A 45%,
            transparent 70%)`,
          pointerEvents: 'none',
          zIndex:    2,
          animation: 'horizon-breathe 8s ease-in-out infinite',
        }}
      />

      {/* Text legibility — broad dark oval behind the centre content */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          inset:      0,
          background: 'radial-gradient(ellipse 60% 75% at 50% 68%, rgba(6,4,2,0.62) 0%, rgba(6,4,2,0.28) 55%, transparent 80%)',
          pointerEvents: 'none',
          zIndex:     3,
        }}
      />

      {/* Top fade */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          top: 0, left: 0, right: 0,
          height:     '200px',
          background: 'linear-gradient(to bottom, rgba(10,8,6,0.88) 0%, rgba(10,8,6,0.32) 60%, transparent 100%)',
          pointerEvents: 'none',
          zIndex:     60,
        }}
      />

      {/* Bottom fade */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          bottom: 0, left: 0, right: 0,
          height:     '42%',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(10,8,4,0.42) 28%, rgba(10,8,4,0.76) 56%, #0C0908 100%)',
          pointerEvents: 'none',
          zIndex:     60,
        }}
      />

      {/* ── 3-column overlay ── */}
      <div className="hero-overlay">

        {/* LEFT SIDEBAR */}
        <aside className="hero-sidebar" aria-label="Locations">
          <div style={{ padding: '14px', borderBottom: '1px solid rgba(200,140,60,0.08)', flexShrink: 0 }}>
            <LocationSearch locations={locations} placeholder="Search location…" />
          </div>

          {/* Favourites section */}
          {favLocations.length > 0 && (
            <>
              <div style={{ padding: '13px 18px 6px', flexShrink: 0 }}>
                <span style={{
                  fontSize:      '0.58rem',
                  fontWeight:    600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color:         '#F0B830',
                  opacity:       0.7,
                }}>
                  ★ Favourites
                </span>
              </div>
              <div style={{ padding: '2px 8px 4px', flexShrink: 0 }}>
                {favLocations.map(loc => <SidebarRow key={loc.id} loc={loc} />)}
              </div>
              <div style={{ height: '1px', background: 'rgba(200,140,60,0.08)', margin: '4px 0', flexShrink: 0 }} />
            </>
          )}

          <div style={{ padding: '13px 18px 9px', flexShrink: 0 }}>
            <span style={{
              fontSize:      '0.58rem',
              fontWeight:    600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color:         '#5A4030',
            }}>
              Tonight across the UK
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '2px 8px 8px' }}>
            {scored.map(loc => <SidebarRow key={loc.id} loc={loc} />)}
          </div>

          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(200,140,60,0.06)', flexShrink: 0 }}>
            <a
              href="#locations"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#5A4030', textDecoration: 'none' }}
            >
              See all locations
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </aside>

        {/* CENTER — primary hero */}
        <div className="hero-center">
          {selectedLoc && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '7px', marginBottom: '6px' }}>
                <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M5.5 0C3.01 0 1 2.01 1 4.5c0 3.375 4.5 9.5 4.5 9.5S10 7.875 10 4.5C10 2.01 7.99 0 5.5 0zm0 6.125A1.625 1.625 0 1 1 5.5 2.875a1.625 1.625 0 0 1 0 3.25z" fill="rgba(237,224,192,0.4)" />
                </svg>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'rgba(237,224,192,0.92)', textShadow: '0 1px 8px rgba(4,3,2,0.8)' }}>
                  {selectedLoc.name}
                  {selectedLoc.region && (
                    <span style={{ fontWeight: 400, color: 'rgba(237,224,192,0.3)' }}>, {selectedLoc.region}</span>
                  )}
                </span>
                <span suppressHydrationWarning style={{ fontSize: '0.75rem', color: 'rgba(237,224,192,0.18)' }}>
                  {formatDate(new Date(), tz)}
                </span>
              </div>

              <div style={{
                fontSize:      '0.58rem',
                fontWeight:    600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color:         'rgba(237,224,192,0.48)',
                marginBottom:  '12px',
                textShadow:    '0 1px 6px rgba(4,3,2,0.7)',
              }}>
                Tonight&apos;s Afterglow
              </div>
            </>
          )}

          <div
            suppressHydrationWarning
            className="hero-score-num"
            style={{ color: scoreColor }}
          >
            {selectedFc?.score ?? '—'}
          </div>

          {selectedFc?.quality && (
            <div style={{
              fontSize:      'clamp(0.78rem, 1.0vw, 0.92rem)',
              fontWeight:    600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color:         scoreColor,
              opacity:       0.75,
              marginBottom:  '14px',
            }}>
              {selectedFc.quality}
            </div>
          )}

          {selectedFc?.reasons?.[0] && (
            <p style={{
              fontSize:   'clamp(0.84rem, 1.05vw, 0.94rem)',
              color:      'rgba(237,224,192,0.82)',
              fontStyle:  'italic',
              fontFamily: 'var(--font-display)',
              lineHeight: 1.65,
              margin:     '0 0 26px',
              maxWidth:   '480px',
              textShadow: '0 1px 12px rgba(4,3,2,0.85), 0 2px 4px rgba(4,3,2,0.6)',
            }}>
              &ldquo;{selectedFc.reasons[0]}.&rdquo;
            </p>
          )}

          {selectedFc && (
            <div className="hero-times-row">
              <div className="hero-times-blocks">
                {([
                  { label: 'Golden Hour', time: selectedFc.goldenHourStart },
                  { label: 'Sunset',      time: selectedFc.sunsetTime      },
                  { label: 'Blue Hour',   time: selectedFc.blueHourEnd     },
                ] as { label: string; time: string | null }[])
                  .filter(t => t.time)
                  .map((t, i, arr) => (
                    <div key={t.label} style={{
                      paddingRight: i < arr.length - 1 ? '22px' : 0,
                      marginRight:  i < arr.length - 1 ? '22px' : 0,
                      borderRight:  i < arr.length - 1 ? '1px solid rgba(200,140,60,0.14)' : 'none',
                    }}>
                      <div style={{ fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(237,224,192,0.48)', marginBottom: '4px', textShadow: '0 1px 6px rgba(4,3,2,0.7)' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: 'clamp(0.88rem, 1.2vw, 1.02rem)', fontWeight: 600, color: '#EDE0C0', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textShadow: '0 1px 10px rgba(4,3,2,0.9)' }}>
                        {formatTime(t.time!, tz)}
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Full Forecast — bold pill */}
              {selectedLoc && (
                <div className="hero-forecast-link">
                  <Link
                    href={`/sunset/${selectedLoc.slug}`}
                    style={{
                      display:        'inline-flex',
                      alignItems:     'center',
                      gap:            '8px',
                      padding:        '10px 22px',
                      background:     `${scoreColor}18`,
                      border:         `1px solid ${scoreColor}55`,
                      borderRadius:   '99px',
                      fontSize:       '0.82rem',
                      fontWeight:     600,
                      color:          scoreColor,
                      textDecoration: 'none',
                      backdropFilter: 'blur(10px)',
                      letterSpacing:  '0.03em',
                      boxShadow:      `0 0 24px ${scoreColor}1A`,
                      transition:     'background 0.2s, box-shadow 0.2s',
                      whiteSpace:     'nowrap',
                    }}
                  >
                    Full Forecast
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Mobile locations trigger — hidden on desktop via CSS */}
          <button
            type="button"
            className="mobile-locations-btn"
            onClick={() => setMobileSheetOpen(true)}
            aria-label="Browse all UK locations"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            All locations
          </button>

          {!selectedFc && (
            <p style={{ fontSize: '0.9rem', color: '#5A4030', fontStyle: 'italic', fontFamily: 'var(--font-display)' }}>
              No forecast data yet — run the seed script to populate locations.
            </p>
          )}
        </div>

        {/* RIGHT PANEL — conditions */}
        {selectedFc && (
          <div className="hero-right">
            <div style={{ padding: '20px 20px 4px' }}>
              <div style={{ fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#5A4030', marginBottom: '14px' }}>
                Conditions
              </div>

              {selectedFc.colourProbability !== null && (
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(200,140,60,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#9A8060' }}>Colour probability</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: scoreColor, fontFamily: 'var(--font-mono)' }}>
                      {Math.round(Math.min(1, Math.max(0, selectedFc.colourProbability)) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: '2px', background: 'rgba(200,140,60,0.12)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      position:        'absolute',
                      inset:           0,
                      background:      `linear-gradient(to right, ${scoreColor}70, ${scoreColor})`,
                      borderRadius:    '2px',
                      transformOrigin: 'left',
                      transform:       `scaleX(${Math.min(1, Math.max(0, selectedFc.colourProbability))})`,
                    }} />
                  </div>
                </div>
              )}

              {conditions.map((row, i) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 0', borderBottom: i < conditions.length - 1 ? '1px solid rgba(200,140,60,0.06)' : 'none' }}>
                  <span style={{ fontSize: '0.76rem', color: '#9A8060', width: '74px', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: '0.68rem', color: '#5A4030', flex: 1 }}>{row.note}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: CONDITION_COLOR[row.ok], fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {((selectedFc.reasons?.length ?? 0) > 0 || (selectedFc.warnings?.length ?? 0) > 0) && (
              <div style={{ padding: '14px 20px 18px', borderTop: '1px solid rgba(200,140,60,0.06)', marginTop: '4px' }}>
                {selectedFc.reasons?.slice(0, 2).map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px' }}>
                    <span style={{ color: '#5FAA88', fontSize: '0.68rem', marginTop: '2px', flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: '0.72rem', color: '#5A4030', lineHeight: 1.55 }}>{r}</span>
                  </div>
                ))}
                {selectedFc.warnings?.slice(0, 1).map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '7px' }}>
                    <span style={{ color: '#B04038', fontSize: '0.68rem', marginTop: '2px', flexShrink: 0 }}>!</span>
                    <span style={{ fontSize: '0.72rem', color: '#5A4030', lineHeight: 1.55 }}>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedLoc && (
              <div style={{ padding: '0 20px 16px' }}>
                <Link
                  href={`/sunset/${selectedLoc.slug}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: 500, color: '#5A4030', textDecoration: 'none' }}
                >
                  View full breakdown
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Week score chart — offset to clear the sidebar */}
      <div
        aria-hidden={weekFc.length === 0}
        className="hero-chart-wrap"
      >
        <WeekScoreChart forecasts={weekFc} />
      </div>

      {/* Mobile location sheet */}
      {mobileSheetOpen && (
        <>
          <div
            className="mobile-sheet-backdrop"
            onClick={() => setMobileSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select a location"
            className="mobile-sheet"
          >
            {/* Handle bar */}
            <div aria-hidden="true" style={{ width: '36px', height: '4px', background: 'rgba(200,140,60,0.25)', borderRadius: '2px', margin: '12px auto 0', flexShrink: 0 }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 10px', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontStyle: 'italic', fontWeight: 700, fontSize: '1.20rem', color: '#EDE0C0', letterSpacing: '-0.02em' }}>
                Locations
              </span>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', color: 'rgba(200,140,60,0.40)', fontSize: '1.5rem', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
              <LocationSearch locations={locations} placeholder="Search location…" />
            </div>

            <div aria-hidden="true" style={{ height: '1px', background: 'rgba(200,140,60,0.08)', flexShrink: 0 }} />

            {/* Scrollable location list */}
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' as const, padding: '4px 8px' }}>
              {favLocations.length > 0 && (
                <>
                  <div style={{ padding: '10px 10px 4px' }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#F0B830', opacity: 0.7 }}>
                      ★ Favourites
                    </span>
                  </div>
                  {favLocations.map(loc => (
                    <SidebarRow key={loc.id} loc={loc} onSelect={() => setMobileSheetOpen(false)} />
                  ))}
                  <div aria-hidden="true" style={{ height: '1px', background: 'rgba(200,140,60,0.08)', margin: '6px 0' }} />
                </>
              )}

              <div style={{ padding: '10px 10px 4px' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A4030' }}>
                  Tonight across the UK
                </span>
              </div>
              {scored.map(loc => (
                <SidebarRow key={loc.id} loc={loc} onSelect={() => setMobileSheetOpen(false)} />
              ))}
            </div>

            {/* Safe area for home indicator */}
            <div aria-hidden="true" style={{ height: 'max(env(safe-area-inset-bottom), 16px)', flexShrink: 0 }} />
          </div>
        </>
      )}
    </section>
  )
}
