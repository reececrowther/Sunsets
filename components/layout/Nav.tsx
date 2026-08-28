'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { NotifyModal } from '@/components/ui/NotifyModal'

interface Props {
  maxWidth?: string
}

export function Nav({ maxWidth = '1200px' }: Props) {
  const [scrolled,    setScrolled]    = useState(false)
  const [notifyOpen,  setNotifyOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header style={{
      position:           'fixed',
      top:                0,
      left:               0,
      right:              0,
      zIndex:             200,
      background:         scrolled ? 'rgba(12,9,8,0.80)' : 'transparent',
      backdropFilter:     scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom:       scrolled ? '1px solid rgba(200,140,60,0.07)' : '1px solid transparent',
      transition:         'background 0.30s ease, border-color 0.30s ease',
    }}>
      <div style={{
        maxWidth,
        margin:         '0 auto',
        padding:        '0 var(--px)',
        height:         '60px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none' }}>
          {/* Setting Sun mark — half-disc bisected by horizon */}
          <svg width="30" height="20" viewBox="0 0 30 20" fill="none" aria-hidden="true">
            <defs>
              <radialGradient id="ag-disc" cx="15" cy="15" r="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#FCD84A"/>
                <stop offset="52%"  stopColor="#F0B830"/>
                <stop offset="100%" stopColor="#C0601A"/>
              </radialGradient>
              <radialGradient id="ag-glow" cx="15" cy="15" r="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#F0B830" stopOpacity="0.30"/>
                <stop offset="42%"  stopColor="#C8701A" stopOpacity="0.10"/>
                <stop offset="100%" stopColor="#C8701A" stopOpacity="0"/>
              </radialGradient>
              <clipPath id="ag-sky">
                <rect x="0" y="0" width="30" height="15"/>
              </clipPath>
            </defs>
            {/* Atmospheric bloom — sky half only */}
            <ellipse cx="15" cy="15" rx="22" ry="15" fill="url(#ag-glow)" clipPath="url(#ag-sky)"/>
            {/* Sun disc — lower half eclipsed by horizon */}
            <circle cx="15" cy="15" r="10" fill="url(#ag-disc)" clipPath="url(#ag-sky)"/>
            {/* Ground */}
            <rect x="0" y="15" width="30" height="5" fill="#0D0806"/>
            {/* Horizon */}
            <line x1="0" y1="15" x2="30" y2="15" stroke="#C8701A" strokeWidth="1.0" strokeOpacity="0.55"/>
          </svg>

          {/* Split wordmark: After (warm white) + glow (gold) */}
          <span style={{
            fontFamily:    'var(--font-display, Georgia, serif)',
            fontStyle:     'italic',
            fontWeight:    700,
            fontSize:      '1.10rem',
            letterSpacing: '-0.02em',
            lineHeight:    1,
          }}>
            <span style={{ color: '#EDE0C0' }}>After</span><span style={{ color: '#F0B830' }}>glow</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="#"
            className="nav-how-it-works"
            style={{
              fontSize:       '0.82rem',
              color:          scrolled ? '#5A4030' : 'rgba(237,224,192,0.45)',
              textDecoration: 'none',
              padding:        '6px 10px',
              transition:     'color 0.30s ease',
            }}
          >
            How it works
          </a>
          <button
            type="button"
            onClick={() => setNotifyOpen(true)}
            style={{
              fontSize:     '0.82rem',
              fontWeight:   600,
              color:        '#C8701A',
              cursor:       'pointer',
              padding:      '7px 16px',
              border:       scrolled ? '1px solid rgba(200,112,26,0.28)' : '1px solid rgba(200,112,26,0.45)',
              borderRadius: '6px',
              background:   scrolled ? 'rgba(200,112,26,0.07)' : 'rgba(200,112,26,0.12)',
              transition:   'background 0.30s ease, border-color 0.30s ease',
            }}
          >
            Go Pro
          </button>
        </nav>
      </div>
      <NotifyModal open={notifyOpen} onClose={() => setNotifyOpen(false)} />
    </header>
  )
}
