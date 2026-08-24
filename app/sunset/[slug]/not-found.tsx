import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{
      maxWidth: '760px',
      margin: '0 auto',
      padding: '80px 24px',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#D4854A',
        marginBottom: '16px',
      }}>
        Location not found
      </p>
      <h1 style={{
        fontSize: '1.8rem',
        fontWeight: 800,
        color: '#E8E4DC',
        letterSpacing: '-0.02em',
        marginBottom: '12px',
      }}>
        We don&apos;t have a forecast for that location yet.
      </h1>
      <p style={{ fontSize: '0.9rem', color: '#6B7A9E', marginBottom: '32px', lineHeight: 1.6 }}>
        Browse the featured UK locations or check back once we&apos;ve expanded coverage.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '10px 24px',
          background: 'rgba(212,133,74,0.12)',
          border: '1px solid rgba(212,133,74,0.3)',
          borderRadius: '8px',
          color: '#D4854A',
          fontWeight: 600,
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}
      >
        Back to SunsetScore
      </Link>
    </main>
  )
}
