'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSupabaseBrowser from '@/lib/supabase/browser'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import {
  getRoomByCode,
  getPlayersByRoom,
  useRoomSubscription,
  usePlayersSubscription,
} from '@/queries'
import { getClientId } from '@/lib/game-utils'
import { Lobby } from '@/components/game/lobby'
import { GameScreen } from '@/components/game/game-screen'
import { VotingScreen } from '@/components/game/voting-screen'
import { ResultsScreen } from '@/components/game/results-screen'
import { JoinRoomForm } from '@/components/game/join-room-form'

type GamePhase = 'joining' | 'lobby' | 'playing' | 'voting' | 'ended'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const supabase = useSupabaseBrowser()
  const clientId = getClientId()

  const [phase, setPhase] = useState<GamePhase>('joining')

  // Query for room data
  const {
    data: room,
    isLoading: isLoadingRoom,
    error: roomError,
  } = useQuery(getRoomByCode(supabase, code))

  // Query for players (only when room exists)
  const {
    data: playersData,
    isLoading: isLoadingPlayers,
  } = useQuery(getPlayersByRoom(supabase, room?.id ?? ''), {
    enabled: !!room?.id,
  })

  // Ensure players is always an array (handle null/undefined from query)
  const players = playersData ?? []

  // Find current player
  const currentPlayer = players.find((p) => p.client_id === clientId) ?? null
  const isHost = room?.host_id === clientId

  // Subscribe to realtime updates
  useRoomSubscription(room?.id)
  usePlayersSubscription(room?.id)

  // Handle navigation on error
  useEffect(() => {
    if (roomError) {
      router.push('/')
    }
  }, [roomError, router])

  // Determine phase based on room status and player state
  useEffect(() => {
    if (!room) return

    if (!currentPlayer) {
      setPhase('joining')
    } else if (room.status === 'ended') {
      setPhase('ended')
    } else if (room.status === 'voting') {
      setPhase('voting')
    } else if (room.status === 'playing') {
      setPhase('playing')
    } else {
      setPhase('lobby')
    }
  }, [room, currentPlayer])

  const isLoading = isLoadingRoom || (!!room && isLoadingPlayers)

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando sala...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return null
  }

  return (
    <main className="min-h-full p-4 flex items-center justify-center bg-gradient-to-br from-background to-muted">
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
