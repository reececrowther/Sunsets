'use client'

import { useState } from 'react'
import { analytics } from '@/lib/analytics/events'

export function EmailSubscribeForm() {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      analytics.emailSubscribe('homepage_footer')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p style={{ fontSize: '0.78rem', color: '#E07540', margin: 0 }}>
        You&apos;re on the list.
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '480px' }}
    >
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Get notified when we launch"
        required
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '8px',
          padding: '7px 12px',
          fontSize: '0.78rem',
          color: '#E8E2D4',
          outline: 'none',
          flex: '1',
          minWidth: '0',
          fontFamily: 'var(--font-sans, system-ui)',
        }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          background: '#E07540',
          border: 'none',
          borderRadius: '8px',
          padding: '7px 14px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#fff',
          cursor: status === 'loading' ? 'default' : 'pointer',
          opacity: status === 'loading' ? 0.65 : 1,
          fontFamily: 'var(--font-sans, system-ui)',
          whiteSpace: 'nowrap',
        }}
      >
        {status === 'loading' ? '…' : 'Notify me'}
      </button>
      {status === 'error' && (
        <span style={{ fontSize: '0.72rem', color: '#FF8080' }}>
          Something went wrong — try again.
        </span>
      )}
    </form>
  )
}
