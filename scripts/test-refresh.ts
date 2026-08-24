// Dev script — fetches a real forecast for Liverpool and prints the result.
// Verifies the full pipeline: Open-Meteo → scoring engine → database.
//
// Run with: npx tsx scripts/test-refresh.ts

import { config } from 'dotenv'
config({ path: '.env.local' })

import { refreshLocation } from '../lib/weather/refresh'
import { getForecastsForLocation } from '../lib/database/forecasts'
import { getLocationBySlug } from '../lib/database/locations'
import { formatTime, formatPercent, formatAzimuth } from '../lib/utils/format'

async function main() {
  console.log('Fetching Liverpool from database...')
  const location = await getLocationBySlug('liverpool')
  if (!location) {
    console.error('Liverpool not found — run the seed script first.')
    process.exit(1)
  }

  console.log(`Refreshing forecast for ${location.name} (${location.latitude}, ${location.longitude})...`)
  const result = await refreshLocation(
    location.id,
    location.name,
    location.latitude,
    location.longitude,
    location.timezone,
  )

  if (result.error) {
    console.error(`Refresh failed: ${result.error}`)
    process.exit(1)
  }

  console.log(`Refreshed ${result.daysRefreshed} days.\n`)

  const forecasts = await getForecastsForLocation(location.id, 7)

  if (forecasts.length === 0) {
    console.error('No forecasts found after refresh.')
    process.exit(1)
  }

  console.log(`Liverpool — 7-day sunset forecast\n${'─'.repeat(60)}`)

  for (const f of forecasts) {
    const sunsetStr = f.sunsetTime
      ? formatTime(f.sunsetTime, location.timezone)
      : 'unknown'

    const scoreStr = f.score !== null ? `${f.score}/100` : 'n/a'
    const quality = f.quality ?? 'n/a'
    const colourProb = f.colourProbability !== null ? formatPercent(f.colourProbability) : 'n/a'
    const confidence = f.confidence !== null ? formatPercent(f.confidence) : 'n/a'
    const azimuth = f.sunsetAzimuth !== null ? formatAzimuth(f.sunsetAzimuth) : 'n/a'

    console.log(`\n${f.forecastDate}`)
    console.log(`  Sunset:       ${sunsetStr}`)
    console.log(`  Score:        ${scoreStr} (${quality})`)
    console.log(`  Colour prob:  ${colourProb}`)
    console.log(`  Confidence:   ${confidence}`)
    console.log(`  Direction:    ${azimuth}`)
    console.log(`  Cloud H/M/L:  ${f.cloudHigh}% / ${f.cloudMid}% / ${f.cloudLow}%`)
    console.log(`  Rain:         ${f.rainProbability}%`)
    console.log(`  Visibility:   ${f.visibility}m`)
    if (f.reasons?.length) {
      console.log(`  Reasons:      ${f.reasons.join(' · ')}`)
    }
    if (f.warnings?.length) {
      console.log(`  Warnings:     ${f.warnings.join(' · ')}`)
    }
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log('Pipeline test complete. All systems nominal.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
