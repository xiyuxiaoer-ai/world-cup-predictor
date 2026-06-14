'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { GameWithRole } from '@/types'
import { useSelectedGame } from '@/hooks/useSelectedGame'
import { createClient } from '@/lib/supabase/client'
import { useOnlineIds } from './PresenceProvider'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  profiles: { username: string; display_name: string | null; avatar_url: string | null }
}

interface Conversation {
  id: string
  game_id: string
  type: 'group' | 'direct'
  user1_id: string | null
  user2_id: string | null
}

interface Member {
  user_id: string
  profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null }
}

interface CurrentUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export default function ChatContent({ games, currentUser }: { games: GameWithRole[]; currentUser: CurrentUser }) {
  const [selectedGameId, setSelectedGameId] = useSelectedGame(games)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const onlineIds = useOnlineIds()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadConvIds, setUnreadConvIds] = useState<Set<string>>(new Set())
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const membersRef = useRef<Member[]>([])
  const selectedConvIdRef = useRef<string | null>(null)

  // Keep refs in sync for use inside realtime callbacks
  useEffect(() => { membersRef.current = members }, [members])
  useEffect(() => { selectedConvIdRef.current = selectedConvId }, [selectedConvId])

  const markRead = useCallback((convId: string) => {
    fetch('/api/chat/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: convId }),
    })
  }, [])

  // Load conversations when game changes
  useEffect(() => {
    if (!selectedGameId) return
    setSelectedConvId(null)
    setMessages([])
    fetch(`/api/chat/conversations?game_id=${selectedGameId}`)
      .then(r => r.json())
      .then((data: (Conversation & { has_unread?: boolean })[]) => {
        if (!Array.isArray(data)) return
        setConversations(data)
        // Seed initial unread state from API
        setUnreadConvIds(new Set(data.filter(c => c.has_unread).map(c => c.id)))
        const group = data.find(c => c.type === 'group')
        if (group) {
          setSelectedConvId(group.id)
          setUnreadConvIds(prev => { const next = new Set(prev); next.delete(group.id); return next })
          setShowSidebar(false)
        }
      })
  }, [selectedGameId])

  // Load game members
  useEffect(() => {
    if (!selectedGameId) return
    fetch(`/api/games/${selectedGameId}/members`)
      .then(r => r.json())
      .then(data => setMembers(Array.isArray(data) ? data : []))
  }, [selectedGameId])

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConvId) return
    setMessages([])
    fetch(`/api/chat/messages?conversation_id=${selectedConvId}`)
      .then(r => r.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : [])
        markRead(selectedConvId)
      })
  }, [selectedConvId, markRead])

  // Realtime: subscribe to new messages in selected conversation
  useEffect(() => {
    if (!selectedConvId) return
    const channel = supabase
      .channel(`msg:${selectedConvId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConvId}` },
        (payload) => {
          const raw = payload.new as { id: string; conversation_id: string; sender_id: string; content: string; created_at: string }
          // Build profiles from local state — avoids extra DB round-trip
          let profiles: Message['profiles']
          if (raw.sender_id === currentUser.id) {
            profiles = { username: currentUser.username, display_name: currentUser.display_name, avatar_url: currentUser.avatar_url }
          } else {
            const member = membersRef.current.find(m => m.user_id === raw.sender_id)
            profiles = member?.profiles ?? { username: raw.sender_id.slice(0, 8), display_name: null, avatar_url: null }
          }
          const fullMsg: Message = { ...raw, profiles }
          setMessages(prev => {
            if (prev.some(m => m.id === fullMsg.id)) return prev
            return [...prev, fullMsg]
          })
          markRead(selectedConvId)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedConvId, supabase, markRead])

  // Realtime: listen for messages in ALL conversations to update sidebar unread dots
  useEffect(() => {
    if (!selectedGameId || conversations.length === 0) return
    const gameConvIds = new Set(conversations.map(c => c.id))

    const channel = supabase
      .channel(`sidebar-unread:${selectedGameId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as { id: string; conversation_id: string; sender_id: string }
        if (msg.sender_id === currentUser.id) return
        if (msg.conversation_id === selectedConvIdRef.current) return
        if (gameConvIds.has(msg.conversation_id)) {
          setUnreadConvIds(prev => new Set([...prev, msg.conversation_id]))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedGameId, conversations, currentUser.id, supabase])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!text.trim() || !selectedConvId || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: selectedConvId, content }),
    })
    setSending(false)
  }

  async function startDM(memberId: string) {
    if (!selectedGameId) return
    const res = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: selectedGameId, other_user_id: memberId }),
    })
    const conv = await res.json()
    if (!conv.id) return
    // Refresh conversations then select the DM
    const data = await fetch(`/api/chat/conversations?game_id=${selectedGameId}`).then(r => r.json())
    if (Array.isArray(data)) setConversations(data)
    setSelectedConvId(conv.id)
    setShowSidebar(false)
  }

  function getConvName(conv: Conversation): string {
    if (conv.type === 'group') return '群聊'
    const otherId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id
    const m = members.find(m => m.user_id === otherId)
    return m?.profiles?.display_name || m?.profiles?.username || '私信'
  }

  function getConvOther(conv: Conversation): Member | null {
    if (conv.type === 'group') return null
    const otherId = conv.user1_id === currentUser.id ? conv.user2_id : conv.user1_id
    return members.find(m => m.user_id === otherId) ?? null
  }

  const selectedConv = conversations.find(c => c.id === selectedConvId) ?? null

  if (!games.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        你还没有加入任何 Game
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ——— Sidebar ——— */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>

        {/* Game selector */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <select
            value={selectedGameId}
            onChange={e => setSelectedGameId(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
          >
            {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Group chat */}
          {conversations.filter(c => c.type === 'group').map(conv => (
            <button
              key={conv.id}
              onClick={() => { setSelectedConvId(conv.id); setUnreadConvIds(prev => { const n = new Set(prev); n.delete(conv.id); return n }); setShowSidebar(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedConvId === conv.id ? 'bg-amber-50 dark:bg-amber-900/20 border-r-2 border-amber-400' : ''}`}
            >
              <div className="relative w-9 h-9 shrink-0">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg">⚽</div>
                {unreadConvIds.has(conv.id) && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">群聊</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{members.length} 位成员</div>
              </div>
            </button>
          ))}

          {/* DMs */}
          {conversations.filter(c => c.type === 'direct').map(conv => {
            const other = getConvOther(conv)
            const isOnline = onlineIds.has(other?.user_id ?? '')
            return (
              <button
                key={conv.id}
                onClick={() => { setSelectedConvId(conv.id); setUnreadConvIds(prev => { const n = new Set(prev); n.delete(conv.id); return n }); setShowSidebar(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedConvId === conv.id ? 'bg-amber-50 dark:bg-amber-900/20 border-r-2 border-amber-400' : ''}`}
              >
                <div className="relative shrink-0">
                  {other?.profiles?.avatar_url ? (
                    <img src={other.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-200">
                      {(other?.profiles?.display_name || other?.profiles?.username || '?')[0].toUpperCase()}
                    </div>
                  )}
                  {/* Online dot (bottom-right) — unread dot (top-right) */}
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  {unreadConvIds.has(conv.id) && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {other?.profiles?.display_name || other?.profiles?.username || '私信'}
                </span>
              </button>
            )
          })}

          {/* Member list for starting DMs */}
          <div className="pt-2 pb-1 border-t border-gray-100 dark:border-gray-700 mt-1">
            <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">成员</div>
            {members
              .filter(m => m.user_id !== currentUser.id)
              .map(m => {
                const isOnline = onlineIds.has(m.user_id)
                return (
                  <button
                    key={m.user_id}
                    onClick={() => startDM(m.user_id)}
                    title="发起私信"
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="relative shrink-0">
                      {m.profiles?.avatar_url ? (
                        <img src={m.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200">
                          {(m.profiles?.display_name || m.profiles?.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 text-left">
                      {m.profiles?.display_name || m.profiles?.username}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{isOnline ? '在线' : '离线'}</span>
                  </button>
                )
              })}
          </div>
        </div>
      </div>

      {/* ——— Message area ——— */}
      <div className={`${!showSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0 bg-gray-50 dark:bg-gray-900`}>
        {selectedConvId && selectedConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <button
                className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
                onClick={() => setShowSidebar(true)}
              >
                ←
              </button>
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {getConvName(selectedConv)}
              </div>
              {selectedConv.type === 'group' && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{members.length} 人</span>
              )}
              {selectedConv.type === 'direct' && (() => {
                const other = getConvOther(selectedConv)
                const isOnline = onlineIds.has(other?.user_id ?? '')
                return (
                  <span className={`flex items-center gap-1 text-xs ${isOnline ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    {isOnline ? '在线' : '离线'}
                  </span>
                )
              })()}
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-8">还没有消息，发一条吧 👋</div>
              )}
              {messages.map((msg) => {
                const isSelf = msg.sender_id === currentUser.id
                const name = msg.profiles?.display_name || msg.profiles?.username || ''
                const timeStr = new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}>
                    {!isSelf && (
                      msg.profiles?.avatar_url ? (
                        <img src={msg.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-200 shrink-0 mt-1">
                          {name[0]?.toUpperCase() || '?'}
                        </div>
                      )
                    )}
                    <div className={`flex flex-col max-w-[70%] ${isSelf ? 'items-end' : 'items-start'}`}>
                      {!isSelf && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 mb-1">{name}</span>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm break-words ${isSelf ? 'bg-amber-500 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm shadow-sm'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{timeStr}</span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="发送消息..."
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors shrink-0"
                >
                  发送
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            选择一个对话开始聊天
          </div>
        )}
      </div>
    </div>
  )
}
