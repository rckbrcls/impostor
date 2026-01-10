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
import { type Player, type Room } from '@/lib/supabase'
import { Lobby } from '@/components/game/lobby'
import { GameScreen } from '@/components/game/game-screen'
import { VotingScreen } from '@/components/game/voting-screen'
import { ResultsScreen } from '@/components/game/results-screen'
import { JoinRoomForm } from '@/components/game/join-room-form'
import { useLanguage } from '@/components/language-context'
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

  // Query for room data
  const {
    data: roomData,
    isLoading: isLoadingRoom,
    error: roomError,
  } = useQuery(getRoomByCode(supabase, code))

  // Type cast is needed because Supabase returns nullable fields
  const room = roomData as Room | undefined

  // Query for players (only when room exists)
  const {
    data: playersData,
    isLoading: isLoadingPlayers,
  } = useQuery(getPlayersByRoom(supabase, room?.id ?? ''), {
    enabled: !!room?.id,
  })

  // Ensure players is always an array (handle null/undefined from query)
  // Type cast is needed because Supabase returns nullable fields
  const players = (playersData ?? []) as Player[]

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
