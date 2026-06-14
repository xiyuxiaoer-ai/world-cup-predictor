'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PresenceContext = createContext<Set<string>>(new Set())

export function useOnlineIds(): Set<string> {
  return useContext(PresenceContext)
}

export default function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !mounted) return

      const channel = supabase.channel('online-users', {
        config: { presence: { key: user.id } },
      })

      const updateState = () => {
        if (!mounted) return
        const state = channel.presenceState()
        setOnlineIds(new Set(Object.keys(state)))
      }

      channel
        .on('presence', { event: 'sync' }, updateState)
        .on('presence', { event: 'join' }, updateState)
        .on('presence', { event: 'leave' }, updateState)
        .subscribe(async (status) => {
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

  return (
    <PresenceContext.Provider value={onlineIds}>
      {children}
    </PresenceContext.Provider>
  )
}
