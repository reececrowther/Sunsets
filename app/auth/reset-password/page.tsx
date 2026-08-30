'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/database/client'
import { AuthCard, AuthInput, AuthButton, AuthError, AuthSuccess, AuthLogo } from '../_components'

export default function ResetPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })
      if (error) { setError(error.message); return }
      setSuccess('Check your inbox — we\'ve sent a password reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthLogo />
      <h1 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontFamily: 'var(--font-display,Georgia,serif)', fontStyle: 'italic', fontWeight: 700, color: '#EDE0C0', letterSpacing: '-0.02em' }}>
        Reset password
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: '0.82rem', color: 'rgba(237,224,192,0.40)', lineHeight: 1.55 }}>
        Enter your email and we'll send you a link to set a new password.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        {error   && <AuthError>{error}</AuthError>}
        {success && <AuthSuccess>{success}</AuthSuccess>}
        {!success && <AuthButton loading={loading}>Send reset link</AuthButton>}
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.78rem' }}>
        <Link href="/auth/login" style={{ color: '#5A4030', textDecoration: 'none' }}>
          ← Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}
