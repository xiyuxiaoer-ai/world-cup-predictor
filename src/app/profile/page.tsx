'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setUsername(data.username || '')
        setDisplayName(data.display_name || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || null)
      }
      setLoading(false)
    })
  }, [router])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setMsg('图片不能超过 2MB'); return }

    setUploading(true)
    setMsg('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setMsg('上传失败：' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(publicUrl)

    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: publicUrl }),
    })

    setMsg('头像已更新')
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName, bio }),
    })
    setSaving(false)
    setMsg(res.ok ? '保存成功 ✓' : '保存失败')
    if (res.ok) router.refresh()
  }

  const initial = (displayName || username || '?')[0].toUpperCase()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-zinc-500">加载中...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={username} />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">个人设置</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative cursor-pointer group"
            onClick={() => fileRef.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700 group-hover:border-emerald-500 transition-colors" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-zinc-700 group-hover:border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl font-bold transition-colors">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-xs">更换头像</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          {uploading && <p className="text-xs text-zinc-400">上传中...</p>}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">用户名（不可修改）</label>
            <input
              value={username}
              disabled
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">显示名称</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={20}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="你的显示名称"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">个人签名</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={60}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              placeholder="一句话介绍自己"
            />
            <p className="text-xs text-zinc-600 mt-1 text-right">{bio.length}/60</p>
          </div>
          {msg && (
            <p className={`text-sm ${msg.includes('✓') || msg.includes('已更新') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      </main>
    </div>
  )
}
