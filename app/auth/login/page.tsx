'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/database/client'
import { AuthCard, AuthInput, AuthButton, AuthError, AuthLogo } from '../_components'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/'
  const urlError     = searchParams.get('error')

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(urlError === 'link_expired' ? 'That link has expired. Please sign in again.' : '')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); return }
      router.push(redirectTo)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthLogo />
      <h1 style={{ margin: '0 0 24px', fontSize: '1.4rem', fontFamily: 'var(--font-display,Georgia,serif)', fontStyle: 'italic', fontWeight: 700, color: '#EDE0C0', letterSpacing: '-0.02em' }}>
        Sign in
      </h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <AuthInput label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <AuthError>{error}</AuthError>}
        <AuthButton loading={loading}>Sign in</AuthButton>
      </form>
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <Link href="/auth/reset-password" style={{ fontSize: '0.78rem', color: '#5A4030', textDecoration: 'none' }}>
          Forgot your password?
        </Link>
        <span style={{ fontSize: '0.78rem', color: '#3A2418' }}>
          No account?{' '}
          <Link href="/auth/signup" style={{ color: '#C8701A', textDecoration: 'none' }}>
            Sign up free
          </Link>
        </span>
      </div>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
