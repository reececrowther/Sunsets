import 'dotenv/config'
import { refreshAuroraForecasts } from '../lib/weather/aurora-refresh'

async function run() {
  const results = await refreshAuroraForecasts()

  const ok     = results.filter(r => !r.error)
  const errors = results.filter(r => r.error)

  console.log(`\nAurora forecast seeded for ${ok.length} locations\n`)

  for (const r of ok) {
    console.log(`  ${r.locationName.padEnd(20)} Kp ${String(r.kpPeak.toFixed(1)).padStart(4)}  score ${String(r.auroraScore).padStart(3)}`)
  }

  if (errors.length) {
    console.log(`\nErrors (${errors.length}):`)
    for (const r of errors) console.log(`  ${r.locationName}: ${r.error}`)
  }
}

run()
