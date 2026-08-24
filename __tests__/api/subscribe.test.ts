import { NextRequest } from 'next/server'

jest.mock('@/lib/email/resend', () => ({ subscribeEmail: jest.fn() }))

import { POST } from '@/app/api/subscribe/route'
import { subscribeEmail } from '@/lib/email/resend'

const mockSubscribe = jest.mocked(subscribeEmail)

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/subscribe', {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
}

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSubscribe.mockResolvedValue(undefined)
  })

  describe('validation', () => {
    it('returns 400 when email is missing', async () => {
      const res = await POST(makeRequest({}))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toBeDefined()
    })

    it('returns 400 when email has no @ symbol', async () => {
      const res = await POST(makeRequest({ email: 'notanemail' }))
      expect(res.status).toBe(400)
    })

    it('returns 400 when email is not a string', async () => {
      const res = await POST(makeRequest({ email: 42 }))
      expect(res.status).toBe(400)
    })
  })

  describe('success', () => {
    it('returns 200 with ok:true for a valid email', async () => {
      const res = await POST(makeRequest({ email: 'user@example.com' }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.ok).toBe(true)
    })

    it('trims and lowercases the email before storing', async () => {
      await POST(makeRequest({ email: '  User@Example.COM  ' }))
      expect(mockSubscribe).toHaveBeenCalledWith('user@example.com', 'homepage_footer')
    })

    it('passes the correct source tag to subscribeEmail', async () => {
      await POST(makeRequest({ email: 'a@b.com' }))
      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(String), 'homepage_footer')
    })
  })

  describe('upstream failure', () => {
    it('returns 500 when subscribeEmail throws', async () => {
      mockSubscribe.mockRejectedValue(new Error('Resend unavailable'))
      const res = await POST(makeRequest({ email: 'a@b.com' }))
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBeDefined()
    })
  })
})
