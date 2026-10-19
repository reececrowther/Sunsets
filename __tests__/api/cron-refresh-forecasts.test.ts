import { NextRequest } from 'next/server'

jest.mock('@/lib/weather/refresh', () => ({
  refreshAllLocations: jest.fn(),
}))

jest.mock('@/lib/alerts/check', () => ({
  checkAndSendAlerts: jest.fn().mockResolvedValue({ sent: 0, errors: 0 }),
}))

jest.mock('@/lib/weather/aurora-refresh', () => ({
  refreshAuroraForecasts: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/lib/weather/tides-refresh', () => ({
  refreshTideForecasts: jest.fn().mockResolvedValue([]),
}))

import { GET } from '@/app/api/cron/refresh-forecasts/route'
import { refreshAllLocations } from '@/lib/weather/refresh'

const mockRefresh = jest.mocked(refreshAllLocations)
const SECRET = 'test-secret-xyz'

function makeRequest(authHeader?: string): NextRequest {
  const headers = new Headers()
  if (authHeader) headers.set('authorization', authHeader)
  return new NextRequest('http://localhost/api/cron/refresh-forecasts', { headers })
}

describe('GET /api/cron/refresh-forecasts', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET
    jest.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.CRON_SECRET
  })

  describe('auth', () => {
    it('returns 401 when Authorization header is absent', async () => {
      const res = await GET(makeRequest())
      expect(res.status).toBe(401)
    })

    it('returns 401 when the Bearer token is wrong', async () => {
      const res = await GET(makeRequest('Bearer wrong-token'))
      expect(res.status).toBe(401)
    })

    it('returns 401 when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET
      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      expect(res.status).toBe(401)
    })
  })

  describe('success', () => {
    beforeEach(() => {
      mockRefresh.mockResolvedValue([
        { locationId: '1', locationName: 'London', daysRefreshed: 7 },
        { locationId: '2', locationName: 'Bath',   daysRefreshed: 7 },
      ])
    })

    it('returns 200 with ok:true', async () => {
      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })

    it('reports total location count', async () => {
      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      const body = await res.json()
      expect(body.locations).toBe(2)
    })

    it('reports succeeded and errors counts', async () => {
      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      const body = await res.json()
      expect(body.succeeded).toBe(2)
      expect(body.errors).toBe(0)
    })

    it('includes durationMs in the response', async () => {
      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      const body = await res.json()
      expect(typeof body.durationMs).toBe('number')
    })
  })

  describe('partial failure', () => {
    it('reports failed locations in errorDetails', async () => {
      mockRefresh.mockResolvedValue([
        { locationId: '1', locationName: 'London', daysRefreshed: 7 },
        { locationId: '2', locationName: 'Bath',   daysRefreshed: 0, error: 'API timeout' },
      ])
      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      const body = await res.json()
      expect(body.errors).toBe(1)
      expect(body.errorDetails[0]).toEqual({ location: 'Bath', error: 'API timeout' })
    })
  })

  describe('hard failure', () => {
    it('returns 500 when refreshAllLocations throws', async () => {
      mockRefresh.mockRejectedValue(new Error('DB connection failed'))
      const res = await GET(makeRequest(`Bearer ${SECRET}`))
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.ok).toBe(false)
      expect(body.error).toBe('DB connection failed')
    })
  })
})
