'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  open:    boolean
  onClose: () => void
}

export function NotifyModal({ open, onClose }: Props) {
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset form each time the modal opens and lock body scroll
  useEffect(() => {
    if (!open) return
    setEmail('')
    setStatus('idle')
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ''
    }
  }, [open])

  // Escape key dismisses
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position:             'fixed',
          inset:                0,
          zIndex:               400,
          background:           'rgba(6,4,3,0.82)',
          backdropFilter:       'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          animation:            'notify-fade 0.20s ease both',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Get notified when Afterglow launches"
        style={{
          position:     'fixed',
          top:          '50%',
          left:         '50%',
          transform:    'translate(-50%, -50%)',
          zIndex:       401,
          width:        'min(440px, calc(100vw - 40px))',
          background:   '#110A06',
          border:       '1px solid rgba(200,140,60,0.18)',
          borderRadius: '22px',
          padding:      '40px 36px 36px',
          boxShadow:    '0 32px 96px rgba(0,0,0,0.75), 0 0 0 1px rgba(200,140,60,0.05)',
          animation:    'notify-up 0.30s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position:     'absolute',
            top:          '14px',
            right:        '14px',
            background:   'none',
            border:       'none',
            cursor:       'pointer',
            color:        'rgba(200,140,60,0.30)',
            fontSize:     '1.3rem',
            lineHeight:   1,
            padding:      '4px 8px',
            borderRadius: '6px',
            transition:   'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(200,140,60,0.70)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,140,60,0.30)')}
        >
          ×
        </button>

        {/* Setting Sun icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px' }}>
          <svg width="56" height="38" viewBox="0 0 56 38" fill="none" aria-hidden="true">
            <defs>
              <radialGradient id="nm-disc" cx="28" cy="30" r="18" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#FCD84A"/>
                <stop offset="50%"  stopColor="#F0B830"/>
                <stop offset="100%" stopColor="#C0601A"/>
              </radialGradient>
              <radialGradient id="nm-glow" cx="28" cy="30" r="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#F0B830" stopOpacity="0.32"/>
                <stop offset="42%"  stopColor="#C8701A" stopOpacity="0.10"/>
                <stop offset="100%" stopColor="#C8701A" stopOpacity="0"/>
              </radialGradient>
              <clipPath id="nm-sky">
                <rect x="0" y="0" width="56" height="30"/>
              </clipPath>
            </defs>
            <ellipse cx="28" cy="30" rx="38" ry="28" fill="url(#nm-glow)" clipPath="url(#nm-sky)"/>
            <circle  cx="28" cy="30" r="18"            fill="url(#nm-disc)" clipPath="url(#nm-sky)"/>
            <rect    x="0"  y="30" width="56" height="8" fill="#0E0806"/>
            <line    x1="0" y1="30" x2="56" y2="30" stroke="#C8701A" strokeWidth="1.4" strokeOpacity="0.50"/>
          </svg>
        </div>

        {/* Headline */}
        <h2 style={{
          fontFamily:    'var(--font-display, Georgia, serif)',
          fontStyle:     'italic',
          fontWeight:    700,
          fontSize:      '1.60rem',
          color:         '#EDE0C0',
          letterSpacing: '-0.03em',
          margin:        '0 0 10px',
          textAlign:     'center',
          lineHeight:    1.15,
        }}>
          Be the first to know
        </h2>

        <p style={{
          fontSize:   '0.84rem',
          color:      '#5A4030',
          textAlign:  'center',
          margin:     '0 0 28px',
          lineHeight: 1.6,
        }}>
          Afterglow is launching soon. Drop your email and we&apos;ll let you know the moment it&apos;s live.
        </p>

        {/* Success state */}
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <p style={{
              fontFamily:    'var(--font-display, Georgia, serif)',
              fontStyle:     'italic',
              fontSize:      '1.10rem',
              color:         '#F0B830',
              margin:        '0 0 6px',
              letterSpacing: '-0.02em',
            }}>
              You&apos;re on the list.
            </p>
            <p style={{ fontSize: '0.80rem', color: '#5A4030' }}>
              We&apos;ll be in touch the moment Afterglow is live.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                display:     'block',
                width:       '100%',
                background:  'rgba(255,255,255,0.04)',
                border:      '1px solid rgba(200,140,60,0.16)',
                borderRadius: '10px',
                padding:     '12px 14px',
                fontSize:    '0.88rem',
                color:       '#EDE0C0',
                outline:     'none',
                marginBottom: '10px',
                fontFamily:  'var(--font-sans, system-ui)',
                boxSizing:   'border-box' as const,
                transition:  'border-color 0.15s',
              }}
              onFocus={e  => (e.target.style.borderColor = 'rgba(200,140,60,0.40)')}
              onBlur={e   => (e.target.style.borderColor = 'rgba(200,140,60,0.16)')}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                display:      'block',
                width:        '100%',
                background:   status === 'loading'
                  ? 'rgba(200,112,26,0.50)'
                  : 'linear-gradient(135deg, #C8701A 0%, #E8902A 100%)',
                border:       'none',
                borderRadius: '10px',
                padding:      '13px 20px',
                fontSize:     '0.88rem',
                fontWeight:   700,
                color:        '#fff',
                cursor:       status === 'loading' ? 'default' : 'pointer',
                fontFamily:   'var(--font-sans, system-ui)',
                letterSpacing: '0.01em',
                boxSizing:    'border-box' as const,
                transition:   'opacity 0.15s',
              }}
            >
              {status === 'loading' ? 'Sending…' : 'Notify me at launch'}
            </button>
            {status === 'error' && (
              <p style={{ fontSize: '0.76rem', color: '#FF8080', textAlign: 'center', marginTop: '10px' }}>
                Something went wrong — please try again.
              </p>
            )}
          </form>
        )}
      </div>
    </>
  )
}
