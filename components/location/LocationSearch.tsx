'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Location } from '@/types'
import { analytics } from '@/lib/analytics/events'

interface Props {
  locations: Location[]
  placeholder?: string
}

export function LocationSearch({ locations, placeholder = 'Search a city, beach or location…' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const results = query.trim().length > 0
    ? locations
        .filter(l =>
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          (l.region ?? '').toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8)
    : []

  useEffect(() => {
    setHighlighted(-1)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function navigate(location: Location) {
    analytics.locationSearch(query)
    setOpen(false)
    setQuery('')
    router.push(`/sunset/${location.slug}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      navigate(results[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', maxWidth: '480px' }}
    >
      {/* Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(255,255,255,0.07)',
        border: open && results.length > 0
          ? '1px solid rgba(224,117,64,0.45)'
          : '1px solid rgba(255,255,255,0.12)',
        borderRadius: open && results.length > 0 ? '12px 12px 0 0' : '12px',
        padding: '0 16px',
        transition: 'border-color 0.15s, border-radius 0.15s',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Search icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
          <line x1="16.5" y1="16.5" x2="22" y2="22" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            color: '#E8E2D4',
            padding: '16px 0',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '1rem',
              lineHeight: 1,
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#0e1424',
            border: '1px solid rgba(224,117,64,0.45)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            overflow: 'hidden',
            zIndex: 10,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}
        >
          {results.map((loc, i) => (
            <button
              key={loc.id}
              role="option"
              aria-selected={i === highlighted}
              type="button"
              onClick={() => navigate(loc)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '13px 18px',
                background: i === highlighted ? 'rgba(224,117,64,0.08)' : 'transparent',
                border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                color: '#E8E2D4',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{loc.name}</div>
                {loc.region && (
                  <div style={{ fontSize: '0.75rem', color: '#3D4E6A', marginTop: '1px' }}>
                    {loc.region}
                  </div>
                )}
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && query.trim().length > 1 && results.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#0e1424',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '16px 18px',
          fontSize: '0.85rem',
          color: '#3D4E6A',
          zIndex: 10,
        }}>
          No locations found for "{query}"
        </div>
      )}
    </div>
  )
}
