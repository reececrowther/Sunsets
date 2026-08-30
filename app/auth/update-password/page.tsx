'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/database/client'
import { AuthCard, AuthInput, AuthButton, AuthError, AuthLogo } from '../_components'

export default function UpdatePasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { setError(error.message); return }
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthLogo />
      <h1 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontFamily: 'var(--font-display,Georgia,serif)', fontStyle: 'italic', fontWeight: 700, color: '#EDE0C0', letterSpacing: '-0.02em' }}>
        Set new password
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: '0.82rem', color: 'rgba(237,224,192,0.40)', lineHeight: 1.55 }}>
        Choose a new password for your account.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <AuthInput label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="8+ characters" />
        <AuthInput label="Confirm password" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error && <AuthError>{error}</AuthError>}
        <AuthButton loading={loading}>Update password</AuthButton>
      </form>
    </AuthCard>
  )
}
