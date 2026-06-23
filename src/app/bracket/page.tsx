import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import BracketContent from '@/components/BracketContent'

export default async function BracketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('username, avatar_url').eq('id', user.id).single()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={profile?.username ?? ''} avatarUrl={profile?.avatar_url} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <BracketContent />
      </main>
    </div>
  )
}
