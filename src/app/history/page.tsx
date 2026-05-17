import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import HistoryContent from '@/components/HistoryContent'
import type { GameWithRole } from '@/types'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('username').eq('id', user.id).single(),
    supabase.from('game_members').select('role, games(id, name, status)').eq('user_id', user.id),
  ])

  const games: GameWithRole[] = (memberships || []).map(m => ({
    id: (m.games as any).id,
    name: (m.games as any).name,
    status: (m.games as any).status,
    role: m.role as 'admin' | 'member',
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={profile?.username ?? ''} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <HistoryContent games={games} />
      </main>
    </div>
  )
}
