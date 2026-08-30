'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/database/client'

const THRESHOLDS = [50, 60, 65, 70, 75, 80, 85, 90]

interface Props {
  locationId:   string
  locationName: string
}

type PanelState = 'loading' | 'signed-out' | 'free' | 'set' | 'unset'

interface AlertPref {
  minScore: number
}

export function AlertPanel({ locationId, locationName }: Props) {
  const [panelState,  setPanelState]  = useState<PanelState>('loading')
  const [pref,        setPref]        = useState<AlertPref | null>(null)
  const [minScore,    setMinScore]    = useState(70)
  const [saving,      setSaving]      = useState(false)
  const [userId,      setUserId]      = useState<string | null>(null)

  const fetchState = useCallback(async () => {
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { setPanelState('signed-out'); return }

    setUserId(user.id)

    // Check subscription tier from public.users
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (!profile || profile.subscription_tier !== 'pro') {
      setPanelState('free')
      return
    }

    // Fetch existing alert preference
    const res  = await fetch(`/api/alerts?locationId=${locationId}`)
    const json = await res.json()
    const existing: AlertPref | null = json.preference

    if (existing) {
      setPref(existing)
      setMinScore(existing.minScore)
      setPanelState('set')
    } else {
      setPanelState('unset')
    }
  }, [locationId])

  useEffect(() => { fetchState() }, [fetchState])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/alerts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ locationId, minScore }),
      })
      setPref({ minScore })
      setPanelState('set')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    setSaving(true)
    try {
      await fetch(`/api/alerts?locationId=${locationId}`, { method: 'DELETE' })
      setPref(null)
      setPanelState('unset')
    } finally {
      setSaving(false)
    }
  }

  if (panelState === 'loading') return null

  if (panelState === 'signed-out') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(237,224,192,0.50)', lineHeight: 1.55 }}>
          Get an email when {locationName} looks spectacular — before you miss it.
        </p>
        <Link
          href={`/auth/login?redirectTo=/sunset/${encodeURIComponent(locationId)}`}
          style={{
            display:      'inline-block',
            padding:      '9px 18px',
            background:   'transparent',
            border:       '1px solid rgba(200,112,26,0.30)',
            borderRadius: '8px',
            fontSize:     '0.80rem',
            fontWeight:   600,
            color:        '#C8701A',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          Sign in to set up alerts
        </Link>
      </div>
    )
  }

  if (panelState === 'free') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(237,224,192,0.50)', lineHeight: 1.55 }}>
          Smart alerts are a Pro feature. Never miss a great sunset at {locationName} again.
        </p>
        <div style={{
          padding:      '14px 16px',
          background:   'rgba(200,112,26,0.06)',
          border:       '1px solid rgba(200,112,26,0.18)',
          borderRadius: '10px',
          fontSize:     '0.78rem',
          color:        '#5A4030',
        }}>
          Upgrade to Pro for <span style={{ color: '#C8701A', fontWeight: 600 }}>£2.99/month</span> to unlock alerts and daily digests.
        </div>
      </div>
    )
  }

  if (panelState === 'set' && pref) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Active indicator */}
          <span style={{
            display:      'inline-flex',
            alignItems:   'center',
            justifyContent: 'center',
            width:        '20px',
            height:       '20px',
            borderRadius: '50%',
            background:   'rgba(95,170,136,0.15)',
            border:       '1px solid rgba(95,170,136,0.35)',
            flexShrink:   0,
          }}>
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
              <path d="M1 3.5L3.5 6L8 1" stroke="#5FAA88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span style={{ fontSize: '0.82rem', color: 'rgba(237,224,192,0.65)' }}>
            Alert active — you'll be emailed when {locationName} scores{' '}
            <span style={{ color: '#C8701A', fontWeight: 600 }}>{pref.minScore}+</span>
          </span>
        </div>

        {/* Threshold adjustment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(237,224,192,0.30)' }}>
            Threshold
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {THRESHOLDS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setMinScore(t) }}
                style={{
                  padding:      '4px 10px',
                  border:       `1px solid ${minScore === t ? 'rgba(200,112,26,0.55)' : 'rgba(200,140,60,0.14)'}`,
                  borderRadius: '6px',
                  background:   minScore === t ? 'rgba(200,112,26,0.12)' : 'transparent',
                  color:        minScore === t ? '#C8701A' : 'rgba(237,224,192,0.25)',
                  fontSize:     '0.72rem',
                  fontWeight:   minScore === t ? 600 : 400,
                  cursor:       'pointer',
                  fontFamily:   'var(--font-mono, monospace)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {minScore !== pref.minScore && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding:      '4px 12px',
                border:       'none',
                borderRadius: '6px',
                background:   'rgba(200,112,26,0.20)',
                color:        '#C8701A',
                fontSize:     '0.72rem',
                fontWeight:   600,
                cursor:       saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? '…' : 'Save'}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleRemove}
          disabled={saving}
          style={{
            alignSelf:    'flex-start',
            padding:      '0',
            border:       'none',
            background:   'none',
            fontSize:     '0.72rem',
            color:        'rgba(237,224,192,0.20)',
            cursor:       saving ? 'wait' : 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          Remove alert
        </button>
      </div>
    )
  }

  // panelState === 'unset'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(237,224,192,0.50)', lineHeight: 1.55 }}>
        We'll email you on the day when {locationName} scores above your threshold.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(237,224,192,0.40)' }}>Alert me when score reaches</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {THRESHOLDS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setMinScore(t)}
              style={{
                padding:      '5px 11px',
                border:       `1px solid ${minScore === t ? 'rgba(200,112,26,0.55)' : 'rgba(200,140,60,0.14)'}`,
                borderRadius: '6px',
                background:   minScore === t ? 'rgba(200,112,26,0.12)' : 'transparent',
                color:        minScore === t ? '#C8701A' : 'rgba(237,224,192,0.25)',
                fontSize:     '0.74rem',
                fontWeight:   minScore === t ? 600 : 400,
                cursor:       'pointer',
                fontFamily:   'var(--font-mono, monospace)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          alignSelf:    'flex-start',
          padding:      '9px 20px',
          background:   'linear-gradient(135deg, #C8701A 0%, #E8902A 100%)',
          border:       'none',
          borderRadius: '8px',
          fontSize:     '0.82rem',
          fontWeight:   700,
          color:        '#fff',
          cursor:       saving ? 'wait' : 'pointer',
          opacity:      saving ? 0.65 : 1,
          fontFamily:   'var(--font-sans, system-ui)',
        }}
      >
        {saving ? 'Setting up…' : `Set alert at ${minScore}+`}
      </button>
    </div>
  )
}
