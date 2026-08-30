'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/database/client'
import { AuthCard, AuthInput, AuthButton, AuthError, AuthSuccess, AuthLogo } from '../_components'

export default function SignupPage() {
  const router = useRouter()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); return }

      // If email confirmation is disabled in Supabase, the user is signed in immediately
      if (data.session) {
        router.push('/')
        router.refresh()
      } else {
        setSuccess('Check your email for a confirmation link, then come back and sign in.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthLogo />
      <h1 style={{ margin: '0 0 24px', fontSize: '1.4rem', fontFamily: 'var(--font-display,Georgia,serif)', fontStyle: 'italic', fontWeight: 700, color: '#EDE0C0', letterSpacing: '-0.02em' }}>
        Create an account
      </h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <AuthInput label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="8+ characters" />
        <AuthInput label="Confirm password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error   && <AuthError>{error}</AuthError>}
        {success && <AuthSuccess>{success}</AuthSuccess>}
        {!success && <AuthButton loading={loading}>Create account</AuthButton>}
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.78rem', color: '#3A2418' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: '#C8701A', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
