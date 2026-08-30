'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/database/client'
import { isAdminEmail } from '@/lib/utils/admin'
import { BreakdownPanel } from './BreakdownPanel'
import type { ScoreBreakdown } from '@/types'

interface Props {
  breakdown: ScoreBreakdown
}

export function BreakdownPanelGated({ breakdown }: Props) {
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (isAdminEmail(user.email ?? '')) { setIsPro(true); return }

      const { data: profile } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_tier === 'pro') setIsPro(true)
    }
    check()
  }, [])

  return <BreakdownPanel breakdown={breakdown} isPro={isPro} />
}
