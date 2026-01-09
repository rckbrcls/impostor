'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Player, type Room } from '@/lib/supabase'
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

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [phase, setPhase] = useState<GamePhase>('joining')
  const [isLoading, setIsLoading] = useState(true)

  const clientId = getClientId()
  const isHost = room?.host_id === clientId

  // Carregar dados iniciais
  useEffect(() => {
    const loadRoom = async () => {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

      if (roomError || !roomData) {
        router.push('/')
        return
      }

      setRoom(roomData)

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('joined_at', { ascending: true })

      setPlayers(playersData || [])

      // Verificar se é jogador
      const player = playersData?.find((p) => p.client_id === clientId)
      setCurrentPlayer(player || null)

      // Determinar fase
      if (!player) {
        setPhase('joining')
      } else if (roomData.status === 'ended') {
        setPhase('ended')
      } else if (roomData.status === 'voting') {
        setPhase('voting')
      } else if (roomData.status === 'playing') {
        setPhase('playing')
      } else {
        setPhase('lobby')
      }

      setIsLoading(false)
    }

    loadRoom()
  }, [code, clientId, router])

  // Realtime: escutar mudanças na sala
  useEffect(() => {
    if (!room?.id) return

    const roomChannel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const newRoom = payload.new as Room
          setRoom(newRoom)

          if (newRoom.status === 'ended') {
            setPhase('ended')
          } else if (newRoom.status === 'voting') {
            setPhase('voting')
          } else if (newRoom.status === 'playing') {
            setPhase('playing')
          } else if (newRoom.status === 'waiting') {
            setPhase('lobby')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
    }
  }, [room?.id])

  // Realtime: escutar mudanças nos jogadores
  useEffect(() => {
    if (!room?.id) return

    const playersChannel = supabase
      .channel(`players-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          // Recarregar lista de jogadores
          const { data: playersData } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', room.id)
            .order('joined_at', { ascending: true })

          setPlayers(playersData || [])

          // Atualizar jogador atual
          const player = playersData?.find((p) => p.client_id === clientId)
          setCurrentPlayer(player || null)

          if (player && phase === 'joining') {
            setPhase('lobby')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(playersChannel)
    }
  }, [room?.id, clientId, phase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <main className="min-h-screen p-4 flex items-center justify-center bg-gradient-to-br from-background to-muted">
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
