import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ChatContent from '@/components/ChatContent'
import type { GameWithRole } from '@/types'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('username, display_name, avatar_url').eq('id', user.id).single(),
    supabase.from('game_members').select('role, games(id, name, status)').eq('user_id', user.id),
  ])

  const games: GameWithRole[] = (memberships || []).map(m => ({
    id: (m.games as any).id,
    name: (m.games as any).name,
    status: (m.games as any).status,
    role: m.role as 'admin' | 'member',
  }))

  const currentUser = {
    id: user.id,
    username: profile?.username ?? '',
    display_name: (profile as any)?.display_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      <Navbar username={profile?.username ?? ''} avatarUrl={profile?.avatar_url} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatContent games={games} currentUser={currentUser} />
      </div>
    </div>
  )
}
