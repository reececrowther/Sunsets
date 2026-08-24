import Link from 'next/link'
import { APP_NAME } from '@/config/brand'

interface Props {
  maxWidth?: string
}

export function Nav({ maxWidth = '1200px' }: Props) {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'rgba(8, 12, 24, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        maxWidth,
        margin: '0 auto',
        padding: '0 var(--px)',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            textDecoration: 'none',
          }}
        >
          {/* Sunset horizon icon */}
          <svg
            width="22"
            height="18"
            viewBox="0 0 22 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 14 A8 8 0 0 1 19 14"
              stroke="#E07540"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <line x1="0" y1="14" x2="22" y2="14" stroke="rgba(224,117,64,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="11" y1="1" x2="11" y2="4.5" stroke="#F5A828" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="4.5" y1="4.5" x2="6.5" y2="6.5" stroke="#F5A828" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
            <line x1="17.5" y1="4.5" x2="15.5" y2="6.5" stroke="#F5A828" strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
            <line x1="1" y1="10" x2="4" y2="10" stroke="#F5A828" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
            <line x1="21" y1="10" x2="18" y2="10" stroke="#F5A828" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          </svg>
          <span style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: '#E8E2D4',
            letterSpacing: '-0.02em',
          }}>
            {APP_NAME}
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="#"
            className="nav-how-it-works"
            style={{
              fontSize: '0.82rem',
              color: '#3D4E6A',
              textDecoration: 'none',
              padding: '6px 10px',
            }}
          >
            How it works
          </a>
          <a
            href="#"
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#E07540',
              textDecoration: 'none',
              padding: '7px 16px',
              border: '1px solid rgba(224,117,64,0.3)',
              borderRadius: '6px',
              background: 'rgba(224,117,64,0.07)',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            className="hover:bg-[rgba(224,117,64,0.14)] hover:border-[rgba(224,117,64,0.5)]"
          >
            Go Pro
          </a>
        </nav>
      </div>
    </header>
  )
}
