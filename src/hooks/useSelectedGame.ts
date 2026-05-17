import { useState, useEffect } from 'react'
import type { GameWithRole } from '@/types'

const STORAGE_KEY = 'wcp_selected_game'

export function useSelectedGame(games: GameWithRole[]) {
  const [selectedGameId, setSelectedGameId] = useState('')

  useEffect(() => {
    if (!games.length) return
    const stored = localStorage.getItem(STORAGE_KEY)
    const validId = games.find(g => g.id === stored)?.id ?? games[0].id
    setSelectedGameId(validId)
  }, [games])

  function setGame(id: string) {
    setSelectedGameId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return [selectedGameId, setGame] as const
}
