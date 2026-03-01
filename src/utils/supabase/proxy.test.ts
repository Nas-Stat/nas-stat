import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateSession } from './proxy'
import { NextRequest } from 'next/server'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

import { createServerClient } from '@supabase/ssr'

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(`http://localhost:3000${pathname}`)
}

function mockUser(user: object | null) {
  vi.mocked(createServerClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  } as never)
}

describe('updateSession middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('unauthenticated user — public routes (no redirect)', () => {
    beforeEach(() => mockUser(null))

    it('allows GET /', async () => {
      const res = await updateSession(makeRequest('/'))
      expect(res.status).not.toBe(307)
      expect(res.headers.get('location')).toBeNull()
    })

    it('allows GET /login', async () => {
      const res = await updateSession(makeRequest('/login'))
      expect(res.status).not.toBe(307)
      expect(res.headers.get('location')).toBeNull()
    })

    it('allows GET /auth/callback', async () => {
      const res = await updateSession(makeRequest('/auth/callback'))
      expect(res.status).not.toBe(307)
      expect(res.headers.get('location')).toBeNull()
    })

    it('allows GET /reports', async () => {
      const res = await updateSession(makeRequest('/reports'))
      expect(res.status).not.toBe(307)
      expect(res.headers.get('location')).toBeNull()
    })

    it('allows GET /reports/123', async () => {
      const res = await updateSession(makeRequest('/reports/123'))
      expect(res.status).not.toBe(307)
      expect(res.headers.get('location')).toBeNull()
    })

    it('allows GET /topics', async () => {
      const res = await updateSession(makeRequest('/topics'))
      expect(res.status).not.toBe(307)
      expect(res.headers.get('location')).toBeNull()
    })

    it('allows GET /topics/456', async () => {
      const res = await updateSession(makeRequest('/topics/456'))
      expect(res.status).not.toBe(307)
      expect(res.headers.get('location')).toBeNull()
    })
  })

  describe('unauthenticated user — protected routes (redirect to /login)', () => {
    beforeEach(() => mockUser(null))

    it('redirects GET /dashboard to /login', async () => {
      const res = await updateSession(makeRequest('/dashboard'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/login')
    })

    it('redirects GET /profile to /login', async () => {
      const res = await updateSession(makeRequest('/profile'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/login')
    })

    it('redirects GET /settings to /login', async () => {
      const res = await updateSession(makeRequest('/settings'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/login')
    })
  })

  describe('authenticated user — all routes pass through', () => {
    beforeEach(() => mockUser({ id: 'user-1', email: 'user@example.com' }))

    it('passes through GET /dashboard', async () => {
      const res = await updateSession(makeRequest('/dashboard'))
      expect(res.status).not.toBe(307)
    })

    it('passes through GET /reports', async () => {
      const res = await updateSession(makeRequest('/reports'))
      expect(res.status).not.toBe(307)
    })

    it('passes through GET /topics', async () => {
      const res = await updateSession(makeRequest('/topics'))
      expect(res.status).not.toBe(307)
    })
  })
})
