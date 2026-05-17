import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={profile?.username ?? ''} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <h1 className="text-xl font-bold mb-6">个人设置</h1>
        <p className="text-zinc-400">开发中...</p>
      </main>
    </div>
  )
}
