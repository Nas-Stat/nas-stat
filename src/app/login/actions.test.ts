import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, signup, signInWithGoogle, logout } from './actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: vi.fn().mockReturnValue('http://localhost:3000'),
  })),
}))

describe('Auth Actions', () => {
  const mockSupabase = {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  })

  describe('login', () => {
    it('redirects with error if validation fails', async () => {
      const formData = new FormData()
      formData.append('email', 'invalid-email')
      formData.append('password', '123')

      await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/login?error='))
    })

    it('redirects with error if Supabase login fails', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: { message: 'Login failed' } })

      await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith('/login?error=Login%20failed')
    })

    it('revalidates and redirects on success', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

      await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/')
    })
  })

  describe('signup', () => {
    it('redirects with error if validation fails', async () => {
      const formData = new FormData()
      formData.append('email', 'invalid-email')
      formData.append('password', '123')

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/login?error='))
    })

    it('redirects with error if role is invalid', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('role', 'invalid-role')

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/login?error='))
    })

    it('redirects with error if Supabase signup fails', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      mockSupabase.auth.signUp.mockResolvedValue({ error: { message: 'Signup failed' } })

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith('/login?error=Signup%20failed')
    })

    it('revalidates and redirects with success message for citizen role', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('role', 'citizen')
      mockSupabase.auth.signUp.mockResolvedValue({ error: null })

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/login?message=Check your email to confirm your account.')
    })

    it('defaults to citizen role when role is not provided', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      mockSupabase.auth.signUp.mockResolvedValue({ error: null })

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({ options: { data: { role: 'citizen' } } }),
      )
    })

    it('passes role to signUp options', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('role', 'obec')
      mockSupabase.auth.signUp.mockResolvedValue({ error: null })

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: { data: { role: 'obec' } },
      })
    })

    it('redirects with official role pending message for obec', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('role', 'obec')
      mockSupabase.auth.signUp.mockResolvedValue({ error: null })

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(
        expect.stringContaining('schv%C3%A1len%C3%AD%20administr%C3%A1torem'),
      )
    })

    it('redirects with official role pending message for kraj', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('role', 'kraj')
      mockSupabase.auth.signUp.mockResolvedValue({ error: null })

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(
        expect.stringContaining('schv%C3%A1len%C3%AD%20administr%C3%A1torem'),
      )
    })

    it('redirects with official role pending message for ministerstvo', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')
      formData.append('role', 'ministerstvo')
      mockSupabase.auth.signUp.mockResolvedValue({ error: null })

      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith(
        expect.stringContaining('schv%C3%A1len%C3%AD%20administr%C3%A1torem'),
      )
    })
  })

  describe('signInWithGoogle', () => {
    it('redirects with error if OAuth fails', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: { message: 'OAuth failed' } })

      await expect(signInWithGoogle()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith('/login?error=OAuth%20failed')
    })

    it('redirects to provider URL on success', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://google.com' }, error: null })

      await expect(signInWithGoogle()).rejects.toThrow('NEXT_REDIRECT')

      expect(redirect).toHaveBeenCalledWith('https://google.com')
    })
  })

  describe('logout', () => {
    it('signs out, revalidates and redirects', async () => {
      await expect(logout()).rejects.toThrow('NEXT_REDIRECT')

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/login')
    })
  })
})
