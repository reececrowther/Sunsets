import * as SunCalc from 'suncalc'

export interface MoonData {
  phase:        number        // 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
  fraction:     number        // illuminated fraction 0–1
  phaseName:    string
  moonrise:     Date | null
  moonset:      Date | null
  alwaysUp:     boolean
  alwaysDown:   boolean
}

const PHASE_NAMES = [
  { max: 0.03,  name: 'New Moon'         },
  { max: 0.22,  name: 'Waxing Crescent'  },
  { max: 0.28,  name: 'First Quarter'    },
  { max: 0.47,  name: 'Waxing Gibbous'   },
  { max: 0.53,  name: 'Full Moon'        },
  { max: 0.72,  name: 'Waning Gibbous'   },
  { max: 0.78,  name: 'Last Quarter'     },
  { max: 0.97,  name: 'Waning Crescent'  },
  { max: 1.01,  name: 'New Moon'         },
]

function phaseName(phase: number): string {
  return PHASE_NAMES.find(p => phase <= p.max)?.name ?? 'New Moon'
}

function validDate(d: unknown): Date | null {
  if (!(d instanceof Date)) return null
  return isNaN(d.getTime()) ? null : d
}

export function getMoonData(date: Date, latitude: number, longitude: number): MoonData {
  const illum = SunCalc.getMoonIllumination(date)
  const times = SunCalc.getMoonTimes(date, latitude, longitude)

  return {
    phase:      illum.phase,
    fraction:   illum.fraction,
    phaseName:  phaseName(illum.phase),
    moonrise:   validDate(times.rise),
    moonset:    validDate(times.set),
    alwaysUp:   times.alwaysUp ?? false,
    alwaysDown: times.alwaysDown ?? false,
  }
}

// Returns the SVG path string for the illuminated region of the moon.
// The path is centred at (0,0) with the given radius.
// Uses the SVG arc technique: right/left semicircle + terminator ellipse.
export function moonLitPath(phase: number, R: number): string {
  if (phase < 0.01 || phase > 0.99) return ''

  const tx          = R * Math.cos(2 * Math.PI * phase)
  const absTx       = Math.abs(tx)
  const returnSweep = tx < 0 ? 1 : 0

  if (phase <= 0.5) {
    // Waxing — right side lit
    return `M 0 ${-R} A ${R} ${R} 0 0 1 0 ${R} A ${absTx} ${R} 0 0 ${returnSweep} 0 ${-R} Z`
  } else {
    // Waning — left side lit
    return `M 0 ${-R} A ${R} ${R} 0 0 0 0 ${R} A ${absTx} ${R} 0 0 ${returnSweep} 0 ${-R} Z`
  }
}
