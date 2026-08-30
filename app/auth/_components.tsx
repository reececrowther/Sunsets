'use client'

import Link from 'next/link'

// ── Shared shell ─────────────────────────────────────────────────────────────

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight:      '100svh',
      background:     '#0C0908',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '24px var(--px, 20px)',
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     '400px',
        background:   'rgba(255,255,255,0.025)',
        border:       '1px solid rgba(200,140,60,0.16)',
        borderRadius: '20px',
        padding:      'clamp(28px, 5vw, 40px)',
      }}>
        {children}
      </div>
    </div>
  )
}

export function AuthLogo() {
  return (
    <div style={{ marginBottom: '28px', textAlign: 'center' }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily:    'var(--font-display, Georgia, serif)',
          fontStyle:     'italic',
          fontWeight:    700,
          fontSize:      '1.35rem',
          letterSpacing: '-0.02em',
        }}>
          <span style={{ color: '#EDE0C0' }}>After</span>
          <span style={{ color: '#F0B830' }}>glow</span>
        </span>
      </Link>
    </div>
  )
}

// ── Form primitives ───────────────────────────────────────────────────────────

interface InputProps {
  label:        string
  type:         string
  value:        string
  onChange:     (v: string) => void
  autoComplete?: string
  placeholder?: string
}

export function AuthInput({ label, type, value, onChange, autoComplete, placeholder }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize:      '0.72rem',
        fontWeight:    600,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color:         'rgba(237,224,192,0.40)',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        style={{
          background:   'rgba(200,140,60,0.06)',
          border:       '1px solid rgba(200,140,60,0.16)',
          borderRadius: '10px',
          padding:      '11px 14px',
          fontSize:     '0.88rem',
          color:        '#EDE0C0',
          outline:      'none',
          width:        '100%',
          boxSizing:    'border-box',
          fontFamily:   'var(--font-sans, system-ui)',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(200,112,26,0.50)' }}
        onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(200,140,60,0.16)' }}
      />
    </div>
  )
}

interface ButtonProps {
  loading:  boolean
  children: React.ReactNode
  type?:    'submit' | 'button'
  onClick?: () => void
  variant?: 'primary' | 'ghost'
}

export function AuthButton({ loading, children, type = 'submit', onClick, variant = 'primary' }: ButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      style={{
        marginTop:    '6px',
        width:        '100%',
        padding:      '13px',
        background:   isPrimary
          ? 'linear-gradient(135deg, #C8701A 0%, #E8902A 100%)'
          : 'transparent',
        border:       isPrimary ? 'none' : '1px solid rgba(200,112,26,0.28)',
        borderRadius: '10px',
        fontSize:     '0.88rem',
        fontWeight:   700,
        color:        isPrimary ? '#fff' : '#C8701A',
        cursor:       loading ? 'wait' : 'pointer',
        opacity:      loading ? 0.65 : 1,
        transition:   'opacity 0.15s ease',
        fontFamily:   'var(--font-sans, system-ui)',
        letterSpacing: '0.01em',
      }}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin:       '2px 0 0',
      padding:      '10px 12px',
      background:   'rgba(200,60,40,0.10)',
      border:       '1px solid rgba(200,60,40,0.22)',
      borderRadius: '8px',
      fontSize:     '0.78rem',
      color:        '#D07060',
      lineHeight:   1.5,
    }}>
      {children}
    </p>
  )
}

export function AuthSuccess({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin:       '2px 0 0',
      padding:      '10px 12px',
      background:   'rgba(95,170,136,0.10)',
      border:       '1px solid rgba(95,170,136,0.22)',
      borderRadius: '8px',
      fontSize:     '0.78rem',
      color:        '#5FAA88',
      lineHeight:   1.5,
    }}>
      {children}
    </p>
  )
}
