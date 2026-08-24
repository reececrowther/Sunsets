// Seed script — 28 UK locations with sunset-viewing context.
// Weighted towards coastal and elevated spots on the western side of the UK
// where the horizon is unobstructed.
//
// Run with: npx tsx scripts/seed-locations.ts

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createAdminClient } from '../lib/database/client'

interface SeedLocation {
  name: string
  slug: string
  country: string
  country_code: string
  region: string | null
  latitude: number
  longitude: number
  timezone: string
  population: number | null
  is_featured: boolean
}

const LOCATIONS: SeedLocation[] = [
  // Cities
  { name: 'Liverpool',    slug: 'liverpool',    country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 53.4084,  longitude: -2.9916,  timezone: 'Europe/London', population: 498042,  is_featured: true  },
  { name: 'London',       slug: 'london',       country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 51.5074,  longitude: -0.1278,  timezone: 'Europe/London', population: 8982000, is_featured: true  },
  { name: 'Brighton',     slug: 'brighton',     country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.8225,  longitude: -0.1372,  timezone: 'Europe/London', population: 290395,  is_featured: true  },
  { name: 'Edinburgh',    slug: 'edinburgh',    country: 'United Kingdom', country_code: 'GB', region: 'Scotland', latitude: 55.9533,  longitude: -3.1883,  timezone: 'Europe/London', population: 524930,  is_featured: true  },
  { name: 'Manchester',   slug: 'manchester',   country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 53.4808,  longitude: -2.2426,  timezone: 'Europe/London', population: 553230,  is_featured: false },
  { name: 'Bristol',      slug: 'bristol',      country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 51.4545,  longitude: -2.5879,  timezone: 'Europe/London', population: 467099,  is_featured: false },
  { name: 'Cardiff',      slug: 'cardiff',      country: 'United Kingdom', country_code: 'GB', region: 'Wales',   latitude: 51.4816,  longitude: -3.1791,  timezone: 'Europe/London', population: 362756,  is_featured: false },
  { name: 'Bath',         slug: 'bath',         country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 51.3781,  longitude: -2.3597,  timezone: 'Europe/London', population: 94782,   is_featured: false },

  // Coastal — north west / Merseyside
  { name: 'Crosby Beach',   slug: 'crosby-beach',   country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 53.4872,  longitude: -3.0519,  timezone: 'Europe/London', population: null, is_featured: true  },
  { name: 'Formby Beach',   slug: 'formby-beach',   country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 53.5614,  longitude: -3.0807,  timezone: 'Europe/London', population: null, is_featured: true  },
  { name: 'New Brighton',   slug: 'new-brighton',   country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 53.4343,  longitude: -3.0491,  timezone: 'Europe/London', population: null, is_featured: false },
  { name: 'Southport',      slug: 'southport',      country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 53.6472,  longitude: -3.0089,  timezone: 'Europe/London', population: 90336, is_featured: false },

  // Coastal — south west
  { name: 'St Ives',        slug: 'st-ives',        country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.2120,  longitude: -5.4802,  timezone: 'Europe/London', population: 11176,  is_featured: true  },
  { name: "Land's End",     slug: 'lands-end',      country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.0654,  longitude: -5.7148,  timezone: 'Europe/London', population: null,   is_featured: false },
  { name: 'Newquay',        slug: 'newquay',        country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.4142,  longitude: -5.0757,  timezone: 'Europe/London', population: 22339,  is_featured: false },
  { name: 'Porthcurno',     slug: 'porthcurno',     country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.0400,  longitude: -5.6468,  timezone: 'Europe/London', population: null,   is_featured: false },
  { name: 'Durdle Door',    slug: 'durdle-door',    country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.6217,  longitude: -2.2749,  timezone: 'Europe/London', population: null,   is_featured: true  },
  { name: 'Torquay',        slug: 'torquay',        country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.4619,  longitude: -3.5260,  timezone: 'Europe/London', population: 65245,  is_featured: false },
  { name: 'Bournemouth',    slug: 'bournemouth',    country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.7192,  longitude: -1.8808,  timezone: 'Europe/London', population: 194490, is_featured: false },

  // Coastal — south east
  { name: 'Seven Sisters',  slug: 'seven-sisters',  country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.7612,  longitude: 0.1731,   timezone: 'Europe/London', population: null,   is_featured: true  },
  { name: 'Whitstable',     slug: 'whitstable',     country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 51.3607,  longitude: 1.0220,   timezone: 'Europe/London', population: 32100,  is_featured: false },
  { name: 'Dungeness',      slug: 'dungeness',      country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 50.9142,  longitude: 0.9752,   timezone: 'Europe/London', population: null,   is_featured: false },

  // Yorkshire & north east
  { name: 'Whitby',         slug: 'whitby',         country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 54.4882,  longitude: -0.6136,  timezone: 'Europe/London', population: 13213,  is_featured: true  },
  { name: 'Scarborough',    slug: 'scarborough',    country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 54.2814,  longitude: -0.4019,  timezone: 'Europe/London', population: 61749,  is_featured: false },
  { name: 'Bamburgh',       slug: 'bamburgh',       country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 55.6089,  longitude: -1.7101,  timezone: 'Europe/London', population: 548,    is_featured: true  },

  // Scotland
  { name: 'Isle of Skye',   slug: 'isle-of-skye',   country: 'United Kingdom', country_code: 'GB', region: 'Scotland', latitude: 57.2736, longitude: -6.2158,  timezone: 'Europe/London', population: 10000,  is_featured: true  },
  { name: 'Portree',        slug: 'portree',         country: 'United Kingdom', country_code: 'GB', region: 'Scotland', latitude: 57.4130, longitude: -6.1946,  timezone: 'Europe/London', population: 2491,   is_featured: false },

  // Inland / hills
  { name: 'Lake District',  slug: 'lake-district',  country: 'United Kingdom', country_code: 'GB', region: 'England', latitude: 54.4609,  longitude: -3.0886,  timezone: 'Europe/London', population: null,   is_featured: false },
]

async function seed() {
  const supabase = createAdminClient()

  console.log(`Seeding ${LOCATIONS.length} locations...`)

  for (const loc of LOCATIONS) {
    const { error } = await supabase
      .from('locations')
      .upsert(loc, { onConflict: 'slug', ignoreDuplicates: false })

    if (error) {
      console.error(`  ✕ ${loc.name}: ${error.message}`)
    } else {
      console.log(`  ✓ ${loc.name}`)
    }
  }

  console.log('Done.')
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
