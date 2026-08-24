import { NextRequest } from 'next/server'

jest.mock('@/lib/database/locations', () => ({ getLocationBySlug: jest.fn() }))
jest.mock('@/lib/database/forecasts',  () => ({ getForecastsForLocation: jest.fn(), isForecastStale: jest.fn() }))
jest.mock('@/lib/weather/refresh',     () => ({ refreshLocation: jest.fn() }))

import { GET } from '@/app/api/forecast/route'
import { getLocationBySlug }        from '@/lib/database/locations'
import { getForecastsForLocation, isForecastStale } from '@/lib/database/forecasts'
import { refreshLocation }          from '@/lib/weather/refresh'

const mockGetLocation    = jest.mocked(getLocationBySlug)
const mockGetForecasts   = jest.mocked(getForecastsForLocation)
const mockIsStale        = jest.mocked(isForecastStale)
const mockRefresh        = jest.mocked(refreshLocation)

const MOCK_LOCATION = {
  id: 'loc-1', slug: 'london', name: 'London',
  latitude: 51.5, longitude: -0.1,
  timezone: 'Europe/London', country: 'GB', region: 'England',
  featured: true, createdAt: new Date().toISOString(),
}

const MOCK_FORECAST = {
  id: 'f-1', locationId: 'loc-1', forecastDate: '2026-08-24',
  score: 72, quality: 'great', updatedAt: new Date().toISOString(),
}

function makeRequest(slug?: string): NextRequest {
  const url = slug
    ? `http://localhost/api/forecast?slug=${slug}`
    : 'http://localhost/api/forecast'
  return new NextRequest(url)
}

describe('GET /api/forecast', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetLocation.mockResolvedValue(MOCK_LOCATION as never)
    mockGetForecasts.mockResolvedValue([MOCK_FORECAST] as never)
    mockIsStale.mockReturnValue(false)
    mockRefresh.mockResolvedValue({ locationId: 'loc-1', locationName: 'London', daysRefreshed: 7 })
  })

  describe('validation', () => {
    it('returns 400 when slug is missing', async () => {
      const res = await GET(makeRequest())
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/slug/)
    })

    it('returns 400 when slug is an empty string', async () => {
      const res = await GET(makeRequest(''))
      expect(res.status).toBe(400)
    })

    it('returns 400 when slug exceeds 100 characters', async () => {
      const res = await GET(makeRequest('a'.repeat(101)))
      expect(res.status).toBe(400)
    })
  })

  describe('location lookup', () => {
    it('returns 404 when no location matches the slug', async () => {
      mockGetLocation.mockResolvedValue(null)
      const res = await GET(makeRequest('unknown-place'))
      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body.error).toMatch(/not found/i)
    })
  })

  describe('success', () => {
    it('returns 200 with location and forecasts', async () => {
      const res = await GET(makeRequest('london'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.location.slug).toBe('london')
      expect(Array.isArray(body.forecasts)).toBe(true)
    })

    it('fetches 7 days of forecasts', async () => {
      await GET(makeRequest('london'))
      expect(mockGetForecasts).toHaveBeenCalledWith('loc-1', 7)
    })

    it('sets Cache-Control header', async () => {
      const res = await GET(makeRequest('london'))
      expect(res.headers.get('cache-control')).toMatch(/s-maxage/)
    })
  })

  describe('background refresh', () => {
    it('does not trigger refresh when forecast is fresh', async () => {
      mockIsStale.mockReturnValue(false)
      await GET(makeRequest('london'))
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('triggers a background refresh when forecast is stale', async () => {
      mockIsStale.mockReturnValue(true)
      await GET(makeRequest('london'))
      expect(mockRefresh).toHaveBeenCalledWith('loc-1', 'London', 51.5, -0.1, 'Europe/London')
    })

    it('triggers a background refresh when forecasts array is empty', async () => {
      mockGetForecasts.mockResolvedValue([])
      await GET(makeRequest('london'))
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
