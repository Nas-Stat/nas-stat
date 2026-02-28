'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { z } from 'zod'

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  const rawData = Object.fromEntries(formData.entries())
  const validated = authSchema.safeParse(rawData)

  if (!validated.success) {
    redirect('/login?error=' + encodeURIComponent(validated.error.issues[0].message))
  }

  const { error } = await supabase.auth.signInWithPassword(validated.data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const rawData = Object.fromEntries(formData.entries())
  const validated = authSchema.safeParse(rawData)

  if (!validated.success) {
    redirect('/login?error=' + encodeURIComponent(validated.error.issues[0].message))
  }

  const { error } = await supabase.auth.signUp(validated.data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to confirm your account.')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  if (data?.url) {
    redirect(data.url)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
