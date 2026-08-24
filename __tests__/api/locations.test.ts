import { NextRequest } from 'next/server'

jest.mock('@/lib/geocoding/mapbox', () => ({ geocodeLocation: jest.fn() }))

import { GET } from '@/app/api/locations/route'
import { geocodeLocation } from '@/lib/geocoding/mapbox'

const mockGeocode = jest.mocked(geocodeLocation)

const MOCK_RESULTS = [
  { name: 'Bristol', region: 'England', country: 'GB', latitude: 51.45, longitude: -2.59, slug: 'bristol' },
]

function makeRequest(q?: string): NextRequest {
  const url = q !== undefined
    ? `http://localhost/api/locations?q=${encodeURIComponent(q)}`
    : 'http://localhost/api/locations'
  return new NextRequest(url)
}

describe('GET /api/locations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGeocode.mockResolvedValue(MOCK_RESULTS as never)
  })

  describe('validation', () => {
    it('returns 400 when q is missing', async () => {
      const res = await GET(makeRequest())
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBeDefined()
    })

    it('returns 400 when q is a single character', async () => {
      const res = await GET(makeRequest('a'))
      expect(res.status).toBe(400)
    })

    it('returns 400 when q exceeds 100 characters', async () => {
      const res = await GET(makeRequest('a'.repeat(101)))
      expect(res.status).toBe(400)
    })

    it('accepts q of exactly 2 characters', async () => {
      const res = await GET(makeRequest('ab'))
      expect(res.status).toBe(200)
    })
  })

  describe('success', () => {
    it('returns 200 with results array', async () => {
      const res = await GET(makeRequest('Bristol'))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(Array.isArray(body.results)).toBe(true)
      expect(body.results).toHaveLength(1)
    })

    it('passes the query string to geocodeLocation', async () => {
      await GET(makeRequest('Bath'))
      expect(mockGeocode).toHaveBeenCalledWith('Bath')
    })
  })

  describe('geocoding failure', () => {
    it('returns 500 when geocodeLocation throws', async () => {
      mockGeocode.mockRejectedValue(new Error('Mapbox unreachable'))
      const res = await GET(makeRequest('London'))
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBeDefined()
    })
  })
})
