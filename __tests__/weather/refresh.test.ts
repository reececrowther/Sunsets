jest.mock('@/lib/weather/met-norway')
jest.mock('@/lib/database/forecasts')
jest.mock('@/lib/astronomy/calculations')

import { refreshLocation } from '@/lib/weather/refresh'
import { fetchWeatherForecast, getWeatherAtTime } from '@/lib/weather/met-norway'
import { upsertForecast } from '@/lib/database/forecasts'
import { getAstronomicalData, getViewingWindow } from '@/lib/astronomy/calculations'
import type { HourlyWeatherPoint } from '@/lib/weather/met-norway'

const mockFetchWeather     = jest.mocked(fetchWeatherForecast)
const mockGetWeatherAtTime = jest.mocked(getWeatherAtTime)
const mockUpsertForecast   = jest.mocked(upsertForecast)
const mockGetAstro         = jest.mocked(getAstronomicalData)
const mockGetViewingWindow = jest.mocked(getViewingWindow)

const SUNSET_TIME = new Date('2026-08-18T19:30:00Z')

const MOCK_ASTRONOMICAL = {
  sunsetTime:      SUNSET_TIME,
  sunriseTime:     new Date('2026-08-18T05:45:00Z'),
  solarNoon:       new Date('2026-08-18T12:37:00Z'),
  goldenHourStart: new Date('2026-08-18T18:45:00Z'),
  goldenHourEnd:   new Date('2026-08-18T20:15:00Z'),
  blueHourStart:   new Date('2026-08-18T05:15:00Z'),
  blueHourEnd:     new Date('2026-08-18T20:15:00Z'),
  sunsetAzimuth:   285.3,
  sunriseAzimuth:  74.7,
}

const MOCK_WEATHER_POINT: HourlyWeatherPoint = {
  time:              '2026-08-18T19:00:00Z',
  cloudCover:        40,
  cloudLow:          5,
  cloudMid:          30,
  cloudHigh:         55,
  precipitationProb: 5,
  visibility:        25000,
  humidity:          55,
  pressure:          1020,
  windSpeed:         18,
  windDirection:     270,
  temperature:       18,
  dewPoint:          8,
}

describe('refreshLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchWeather.mockResolvedValue({
      latitude:  51.5,
      longitude: -0.1,
      hourly:    [],
      fetchedAt: new Date(),
    })
    mockGetWeatherAtTime.mockReturnValue(MOCK_WEATHER_POINT)
    mockGetAstro.mockReturnValue(MOCK_ASTRONOMICAL)
    mockGetViewingWindow.mockReturnValue({
      start: new Date('2026-08-18T18:50:00Z'),
      end:   new Date('2026-08-18T20:15:00Z'),
    })
    mockUpsertForecast.mockResolvedValue(undefined)
  })

  it('fetches weather with the correct coordinates and timezone', async () => {
    await refreshLocation('loc-1', 'London', 51.5, -0.1, 'Europe/London')
    expect(mockFetchWeather).toHaveBeenCalledWith(51.5, -0.1, 'Europe/London')
  })

  it('upserts a forecast for all 7 days (today + 6 ahead)', async () => {
    await refreshLocation('loc-1', 'London', 51.5, -0.1, 'Europe/London')
    expect(mockUpsertForecast).toHaveBeenCalledTimes(7)
  })

  it('returns daysRefreshed = 7 when all days have weather data', async () => {
    const result = await refreshLocation('loc-1', 'London', 51.5, -0.1, 'Europe/London')
    expect(result.daysRefreshed).toBe(7)
    expect(result.error).toBeUndefined()
  })

  it('skips days where getWeatherAtTime returns null', async () => {
    let call = 0
    mockGetWeatherAtTime.mockImplementation(() => {
      call++
      return call % 2 === 0 ? null : MOCK_WEATHER_POINT
    })
    const result = await refreshLocation('loc-1', 'London', 51.5, -0.1, 'Europe/London')
    expect(result.daysRefreshed).toBeLessThan(7)
    expect(mockUpsertForecast.mock.calls.length).toBe(result.daysRefreshed)
  })

  it('writes a valid score (0–100) and quality label to the DB', async () => {
    await refreshLocation('loc-1', 'London', 51.5, -0.1, 'Europe/London')
    const upserted = mockUpsertForecast.mock.calls[0][0]
    expect(upserted.score).toBeGreaterThanOrEqual(0)
    expect(upserted.score).toBeLessThanOrEqual(100)
    expect(['poor', 'fair', 'good', 'great', 'excellent']).toContain(upserted.quality)
  })

  it('writes astronomical and weather fields to the DB', async () => {
    await refreshLocation('loc-1', 'London', 51.5, -0.1, 'Europe/London')
    const upserted = mockUpsertForecast.mock.calls[0][0]
    expect(upserted.locationId).toBe('loc-1')
    expect(upserted.sunsetTime).toBe(SUNSET_TIME.toISOString())
    expect(upserted.cloudHigh).toBe(MOCK_WEATHER_POINT.cloudHigh)
    expect(upserted.sunsetAzimuth).toBe(MOCK_ASTRONOMICAL.sunsetAzimuth)
    expect(upserted.weatherSource).toBe('met-norway')
  })

  it('confidence decreases for forecasts further into the future', async () => {
    await refreshLocation('loc-1', 'London', 51.5, -0.1, 'Europe/London')
    const day0 = mockUpsertForecast.mock.calls[0][0]
    const day6 = mockUpsertForecast.mock.calls[6][0]
    expect(day0.confidence!).toBeGreaterThan(day6.confidence!)
  })

  it('returns an error result when fetchWeatherForecast throws', async () => {
    mockFetchWeather.mockRejectedValue(new Error('MET Norway unavailable'))
    const result = await refreshLocation('loc-1', 'London', 51.5, -0.1, 'Europe/London')
    expect(result.error).toBe('MET Norway unavailable')
    expect(result.daysRefreshed).toBe(0)
    expect(mockUpsertForecast).not.toHaveBeenCalled()
  })

  it('returns correct locationId and locationName in all cases', async () => {
    const result = await refreshLocation('loc-99', 'Brighton', 50.8, -0.1, 'Europe/London')
    expect(result.locationId).toBe('loc-99')
    expect(result.locationName).toBe('Brighton')
  })
})
