import type { SunsetQuality } from '@/types'

interface Colors { bg: string; text: string; border: string }

const COLORS: Record<SunsetQuality, Colors> = {
  excellent: { bg: 'rgba(245,168,40,0.12)',  text: '#F5A828', border: 'rgba(245,168,40,0.25)'  },
  great:     { bg: 'rgba(224,117,64,0.12)',  text: '#E07540', border: 'rgba(224,117,64,0.25)'  },
  good:      { bg: 'rgba(95,170,136,0.12)',  text: '#5FAA88', border: 'rgba(95,170,136,0.25)'  },
  fair:      { bg: 'rgba(122,141,184,0.10)', text: '#7A8DB8', border: 'rgba(122,141,184,0.22)' },
  poor:      { bg: 'rgba(74,88,114,0.10)',   text: '#5A6882', border: 'rgba(74,88,114,0.20)'   },
}

const PAD:  Record<'sm'|'md'|'lg', string> = { sm: '3px 9px',  md: '4px 12px', lg: '5px 16px' }
const SIZE: Record<'sm'|'md'|'lg', string> = { sm: '0.65rem', md: '0.75rem',  lg: '0.85rem'  }

interface Props {
  quality: SunsetQuality
  size?: 'sm' | 'md' | 'lg'
}

export function QualityBadge({ quality, size = 'md' }: Props) {
  const c = COLORS[quality]
  return (
    <span style={{
      display: 'inline-block',
      padding: PAD[size],
      fontSize: SIZE[size],
      fontWeight: 700,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      color: c.text,
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: '5px',
      whiteSpace: 'nowrap',
    }}>
      {quality}
    </span>
  )
}
