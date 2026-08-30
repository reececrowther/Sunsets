'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SunsetQuality } from '@/types'

const QUALITIES: { label: string; value: number; quality: SunsetQuality }[] = [
  { label: 'Poor',      value: 1, quality: 'poor'      },
  { label: 'Fair',      value: 2, quality: 'fair'       },
  { label: 'Good',      value: 3, quality: 'good'       },
  { label: 'Great',     value: 4, quality: 'great'      },
  { label: 'Excellent', value: 5, quality: 'excellent'  },
]

const Q_COLOR: Record<SunsetQuality, string> = {
  poor:      '#504840',
  fair:      '#8890B8',
  good:      '#5FAA88',
  great:     '#C8701A',
  excellent: '#F0B830',
}

function averageToQuality(avg: number): SunsetQuality {
  if (avg >= 4.5) return 'excellent'
  if (avg >= 3.5) return 'great'
  if (avg >= 2.5) return 'good'
  if (avg >= 1.5) return 'fair'
  return 'poor'
}

function localKey(locationId: string, forecastDate: string) {
  return `ss-rated-${locationId}-${forecastDate}`
}

interface Props {
  locationId:   string
  forecastDate: string  // YYYY-MM-DD
}

interface Aggregate {
  count:   number
  average: number
}

export function RatingWidget({ locationId, forecastDate }: Props) {
  const [submitted, setSubmitted]   = useState<number | null>(null)  // the rating value 1–5
  const [aggregate, setAggregate]   = useState<Aggregate | null>(null)
  const [hovered, setHovered]       = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Check localStorage for a previous rating on this location+date
  useEffect(() => {
    const saved = localStorage.getItem(localKey(locationId, forecastDate))
    if (saved) setSubmitted(Number(saved))
  }, [locationId, forecastDate])

  // Fetch the current aggregate
  const fetchAggregate = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/ratings?locationId=${locationId}&forecastDate=${forecastDate}`,
      )
      if (res.ok) setAggregate(await res.json())
    } catch {
      // non-fatal — aggregate display is best-effort
    }
  }, [locationId, forecastDate])

  useEffect(() => { fetchAggregate() }, [fetchAggregate])

  async function handleRate(rating: number) {
    if (submitting || submitted !== null) return
    setSubmitting(true)
    try {
      await fetch('/api/ratings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ locationId, forecastDate, rating }),
      })
      localStorage.setItem(localKey(locationId, forecastDate), String(rating))
      setSubmitted(rating)
      await fetchAggregate()
    } finally {
      setSubmitting(false)
    }
  }

  const activeRating = hovered ?? submitted ?? 0
  const q = QUALITIES.find(q => q.value === submitted)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {submitted === null ? (
        <>
          <p style={{
            margin:        0,
            fontSize:      '0.82rem',
            color:         'rgba(237,224,192,0.60)',
            letterSpacing: '0.01em',
          }}>
            Were you there? Rate what you actually saw.
          </p>

          {/* Quality pill buttons */}
          <div
            role="group"
            aria-label="Rate this sunset"
            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
          >
            {QUALITIES.map(({ label, value, quality }) => {
              const isActive = activeRating >= value
              const col      = Q_COLOR[quality]
              return (
                <button
                  key={value}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRate(value)}
                  onMouseEnter={() => setHovered(value)}
                  onMouseLeave={() => setHovered(null)}
                  aria-label={`Rate as ${label}`}
                  style={{
                    padding:        '7px 14px',
                    border:         `1px solid ${isActive ? col : 'rgba(200,140,60,0.18)'}`,
                    borderRadius:   '20px',
                    background:     isActive ? `${col}22` : 'transparent',
                    color:          isActive ? col : 'rgba(237,224,192,0.30)',
                    fontSize:       '0.76rem',
                    fontWeight:     isActive ? 600 : 400,
                    letterSpacing:  '0.04em',
                    cursor:         submitting ? 'wait' : 'pointer',
                    transition:     'all 0.15s ease',
                    whiteSpace:     'nowrap',
                    fontFamily:     'var(--font-sans, system-ui)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          {/* Submitted state */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'rgba(237,224,192,0.40)' }}>
              Your rating:
            </span>
            <span style={{
              fontSize:      '0.78rem',
              fontWeight:    600,
              letterSpacing: '0.06em',
              color:         q ? Q_COLOR[q.quality] : '#C8701A',
              textTransform: 'uppercase',
            }}>
              {q?.label}
            </span>
          </div>

          {/* Change rating */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {QUALITIES.map(({ label, value, quality }) => {
              const isSelected = submitted === value
              const col        = Q_COLOR[quality]
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(localKey(locationId, forecastDate))
                    setSubmitted(null)
                  }}
                  aria-label={`Change rating (currently ${label})`}
                  style={{
                    padding:       '5px 11px',
                    border:        `1px solid ${isSelected ? col : 'rgba(200,140,60,0.12)'}`,
                    borderRadius:  '20px',
                    background:    isSelected ? `${col}22` : 'transparent',
                    color:         isSelected ? col : 'rgba(237,224,192,0.20)',
                    fontSize:      '0.70rem',
                    fontWeight:    isSelected ? 600 : 400,
                    letterSpacing: '0.04em',
                    cursor:        'pointer',
                    whiteSpace:    'nowrap',
                    fontFamily:    'var(--font-sans, system-ui)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Community aggregate — only shown when ≥ 3 ratings */}
      {aggregate && aggregate.count >= 3 && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          paddingTop:   '10px',
          borderTop:    '1px solid rgba(200,140,60,0.08)',
          flexWrap:     'wrap',
        }}>
          {/* Coloured quality dot */}
          <span style={{
            display:      'inline-block',
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   Q_COLOR[averageToQuality(aggregate.average)],
            flexShrink:   0,
          }} />
          <span style={{ fontSize: '0.74rem', color: 'rgba(237,224,192,0.35)' }}>
            {aggregate.count} {aggregate.count === 1 ? 'person' : 'people'} rated this sunset
          </span>
          <span aria-hidden="true" style={{ color: 'rgba(237,224,192,0.12)' }}>·</span>
          <span style={{
            fontSize:      '0.74rem',
            fontWeight:    600,
            color:         Q_COLOR[averageToQuality(aggregate.average)],
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {averageToQuality(aggregate.average)}
          </span>
          <span style={{ fontSize: '0.70rem', color: 'rgba(237,224,192,0.20)', fontFamily: 'var(--font-mono)' }}>
            avg {aggregate.average}/5
          </span>
        </div>
      )}

      {/* Prompt when no ratings yet and not yet submitted */}
      {aggregate && aggregate.count === 0 && submitted === null && (
        <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(237,224,192,0.18)', fontStyle: 'italic' }}>
          Be the first to rate this sunset
        </p>
      )}
    </div>
  )
}
