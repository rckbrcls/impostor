'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSupabaseBrowser from '@/lib/supabase/browser'
import { getRoomByCode, getPlayersByRoom } from '@/queries'
import { getClientId } from '@/lib/game-utils'
import { type Player, type Room } from '@/lib/supabase'
import { Lobby } from '@/components/game/lobby'
import { GameScreen } from '@/components/game/game-screen'
import { VotingScreen } from '@/components/game/voting-screen'
import { ResultsScreen } from '@/components/game/results-screen'
import { JoinRoomForm } from '@/components/game/join-room-form'
import { useLanguage } from '@/stores/language-store'
import { Skeleton } from '@/components/ui/skeleton'

type GamePhase = 'joining' | 'lobby' | 'playing' | 'voting' | 'ended'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const supabase = useSupabaseBrowser()
  const clientId = getClientId()
  const { t } = useLanguage()

  const [phase, setPhase] = useState<GamePhase>('joining')
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true)
  const [roomError, setRoomError] = useState<boolean>(false)

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    try {
      const { data, error } = await getRoomByCode(supabase, code)
      if (error) {
        setRoomError(true)
        return
      }
      setRoom(data as Room)
    } catch {
      setRoomError(true)
    } finally {
      setIsLoadingRoom(false)
    }
  }, [supabase, code])

  // Fetch players data
  const fetchPlayers = useCallback(async () => {
    if (!room?.id) return
    try {
      const { data } = await getPlayersByRoom(supabase, room.id)
      setPlayers((data ?? []) as Player[])
    } finally {
      setIsLoadingPlayers(false)
    }
  }, [supabase, room?.id])

  // Initial fetch
  useEffect(() => {
    fetchRoom()
  }, [fetchRoom])

  // Fetch players when room is available
  useEffect(() => {
    if (room?.id) {
      fetchPlayers()
    }
  }, [room?.id, fetchPlayers])

  // Realtime subscription for room
  useEffect(() => {
    if (!room?.id) return

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        () => {
          fetchRoom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, room?.id, fetchRoom])

  // Realtime subscription for players
  useEffect(() => {
    if (!room?.id) return

    const channel = supabase
      .channel(`players-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          fetchPlayers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, room?.id, fetchPlayers])

  console.log('[DEBUG RoomPage] Room:', { room, isLoadingRoom, roomError })
  console.log('[DEBUG RoomPage] Players:', { players, isLoadingPlayers, playersCount: players.length })

  // Find current player
  const currentPlayer = players.find((p) => p.client_id === clientId) ?? null
  const isHost = room?.host_id === clientId
  console.log('[DEBUG RoomPage] Current player:', { currentPlayer, clientId, isHost })

  // Handle navigation on error
  useEffect(() => {
    if (roomError) {
      router.push('/')
    }
  }, [roomError, router])

  // Cleanup player when browser/tab is closed
  useEffect(() => {
    if (!currentPlayer || !room?.id) return

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable cleanup on page close
      navigator.sendBeacon(
        '/api/leave-room',
        JSON.stringify({
          playerId: currentPlayer.id,
          roomId: room.id,
        })
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [currentPlayer, room?.id])

  // Determine phase based on room status and player state
  useEffect(() => {
    console.log('[DEBUG RoomPage] Phase effect running:', { room, currentPlayer })
    if (!room) {
      console.log('[DEBUG RoomPage] No room, not setting phase')
      return
    }

    let newPhase: GamePhase
    if (!currentPlayer) {
      newPhase = 'joining'
    } else if (room.status === 'ended') {
      newPhase = 'ended'
    } else if (room.status === 'voting') {
      newPhase = 'voting'
    } else if (room.status === 'playing') {
      newPhase = 'playing'
    } else {
      newPhase = 'lobby'
    }
    console.log('[DEBUG RoomPage] Setting phase to:', newPhase, '(current:', phase, ')')
    setPhase(newPhase)
  }, [room, currentPlayer])

  const isLoading = isLoadingRoom || (!!room && isLoadingPlayers)

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Skeleton className="w-full max-w-md h-80 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]" />
      </div>
    )
  }

  if (!room) {
    return null
  }

  return (
    <main className="min-h-full p-4 flex items-center justify-center">
      {phase === 'joining' && <JoinRoomForm initialCode={code} />}

      {phase === 'lobby' && (
        <Lobby
          room={room}
          players={players}
          onGameStart={() => setPhase('playing')}
        />
      )}

      {phase === 'playing' && (
        <GameScreen
          room={room}
          players={players}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onStartVoting={() => setPhase('voting')}
        />
      )}

      {phase === 'voting' && (
        <VotingScreen
          room={room}
          players={players}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onNextRound={() => setPhase('playing')}
          onEndGame={() => setPhase('ended')}
        />
      )}

      {phase === 'ended' && <ResultsScreen room={room} players={players} />}
    </main>
  )
}
