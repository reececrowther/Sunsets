// WorldTides API v3 client — fetches tidal extremes (high/low) for a location.
// Sign up for a free API key at https://www.worldtides.info
// Set WORLDTIDES_API_KEY in your environment variables.
// Free tier: 500 calls/month (sufficient for ~16 coastal locations refreshed daily).

const BASE = 'https://www.worldtides.info/api/v3'

export type TideType = 'High' | 'Low'

export interface TideExtreme {
  timestamp: number   // Unix seconds UTC
  isoDate:   string   // ISO 8601 with offset
  height:    number   // metres above chart datum
  type:      TideType
}

interface WorldTidesResponse {
  status:   number
  extremes: Array<{
    dt:     number
    date:   string
    height: number
    type:   TideType
  }>
  error?: string
}

export async function fetchTideExtremes(
  latitude:  number,
  longitude: number,
  date:      string,  // YYYY-MM-DD UTC
): Promise<TideExtreme[]> {
  const key = process.env.WORLDTIDES_API_KEY
  if (!key) return []

  const url = new URL(BASE)
  url.searchParams.set('extremes', '')
  url.searchParams.set('lat',  String(latitude))
  url.searchParams.set('lon',  String(longitude))
  url.searchParams.set('key',  key)
  url.searchParams.set('days', '1')
  url.searchParams.set('date', date)

  const res  = await fetch(url.toString(), {
    headers: { 'User-Agent': 'SunsetScore/1.0 (contact@sunsetscore.app)' },
    next:    { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`WorldTides HTTP ${res.status}`)

  const data = (await res.json()) as WorldTidesResponse
  if (data.status !== 200) throw new Error(data.error ?? `WorldTides status ${data.status}`)

  return (data.extremes ?? []).map(e => ({
    timestamp: e.dt,
    isoDate:   e.date,
    height:    Number(e.height.toFixed(2)),
    type:      e.type,
  }))
}
