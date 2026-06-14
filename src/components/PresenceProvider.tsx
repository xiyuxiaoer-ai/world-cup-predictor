'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PresenceProvider() {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return

      const channel = supabase.channel('online-users', {
        config: { presence: { key: user.id } },
      })

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })

      channelRef.current = channel
    })

    return () => {
      mounted = false
      channelRef.current?.unsubscribe()
    }
  }, [])

  return null
}
