// Format a Date (or ISO string) as a local time string in the given IANA timezone.
// Always display sunset times in the location's timezone, never the user's.

export function formatTime(
  date: Date | string,
  timezone: string,
  opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false },
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-GB', { ...opts, timeZone: timezone })
}

export function formatDate(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timezone,
  })
}

export function formatShortDate(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: timezone,
  })
}

// "87" → "87/100"
export function formatScore(score: number): string {
  return `${score}/100`
}

// 0.82 → "82%"
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

// 14500 → "14.5km" / 800 → "800m"
export function formatVisibility(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)}km`
  return `${metres}m`
}

// 296 → "296° NW"
export function formatAzimuth(degrees: number): string {
  const directions = ['N','NNE','NE','ENE','E','ESE','SE','SSE',
                      'S','SSW','SW','WSW','W','WNW','NW','NNW']
  const idx = Math.round(degrees / 22.5) % 16
  return `${Math.round(degrees)}° ${directions[idx]}`
}

// "2026-08-24" → "Mon 24" (compact, for forecast strip)
export function formatStripDate(date: Date | string, timezone: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    timeZone: timezone,
  })
}
