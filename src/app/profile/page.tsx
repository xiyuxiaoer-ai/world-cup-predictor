'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import PageBackground from '@/components/PageBackground'

async function getCroppedBlob(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.9))
}

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
        setSavedAvatarUrl(data.avatar_url || null)
      }
      setLoading(false)
    })
  }, [router])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleCropConfirm() {
    if (!cropSrc || !croppedAreaPixels) return
    const blob = await getCroppedBlob(cropSrc, croppedAreaPixels)
    setPendingBlob(blob)
    setPreviewUrl(URL.createObjectURL(blob))
    setCropSrc(null)
    setMsg('头像已选择，点击保存生效')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')

    let avatarUrl = savedAvatarUrl

    if (pendingBlob) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const path = `${user.id}/avatar_${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, pendingBlob, { contentType: 'image/jpeg' })

        if (uploadError) {
          setMsg('头像上传失败：' + uploadError.message)
          setSaving(false)
          return
        }
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = publicUrl
      }
    }

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName, bio, avatar_url: avatarUrl }),
    })

    setSaving(false)
    if (res.ok) {
      router.push('/members')
    } else {
      setMsg('保存失败')
      setSaving(false)
    }
  }

  const displayAvatarUrl = previewUrl || savedAvatarUrl
  const initial = (displayName || username || '?')[0].toUpperCase()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-zinc-500">加载中...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar username={username} avatarUrl={displayAvatarUrl} />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">个人设置</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative cursor-pointer group" onClick={() => fileRef.current?.click()}>
            {displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700 group-hover:border-emerald-500 transition-colors" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-zinc-700 group-hover:border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl font-bold transition-colors">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-xs">更换头像</span>
            </div>
          </div>
          {pendingBlob && <p className="text-xs text-amber-400">头像待保存</p>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">用户名（不可修改）</label>
            <input value={username} disabled
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">显示名称</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              maxLength={20}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="你的显示名称" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">个人签名</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              maxLength={60} rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              placeholder="一句话介绍自己" />
            <p className="text-xs text-zinc-600 mt-1 text-right">{bio.length}/60</p>
          </div>
          {msg && (
            <p className={`text-sm ${msg.includes('✓') ? 'text-emerald-400' : msg.includes('待保存') || msg.includes('已选择') ? 'text-amber-400' : 'text-red-400'}`}>
              {msg}
            </p>
          )}
          <button type="submit" disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      </main>

      {/* Crop Modal */}
      {cropSrc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="font-semibold">裁剪头像</span>
            <button onClick={() => setCropSrc(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <div className="relative flex-1">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="px-4 py-4 space-y-3 border-t border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 shrink-0">缩放</span>
              <input type="range" min={1} max={3} step={0.05} value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="flex-1 accent-emerald-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCropSrc(null)}
                className="flex-1 border border-zinc-700 text-zinc-400 py-2.5 rounded-lg hover:border-zinc-500 transition-colors">
                取消
              </button>
              <button onClick={handleCropConfirm}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2.5 rounded-lg transition-colors">
                确认裁剪
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
