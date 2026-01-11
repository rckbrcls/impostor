'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSupabaseBrowser from '@/lib/supabase/browser'
import { getRoomByCode, getPlayersByRoom } from '@/queries'
import { getClientId } from '@/lib/game-utils'
import {
  type Player,
  type Room,
  type Game,
  type Round,
  type GamePlayerWithPlayer,
  getActiveGame,
  getCurrentRound,
  getGamePlayers
} from '@/lib/supabase'
import { Lobby } from '@/components/game/lobby'
import { GameScreen } from '@/components/game/game-screen'
import { VotingScreen } from '@/components/game/voting-screen'
import { VoteConclusionScreen } from '@/components/game/vote-conclusion-screen'
import { ResultsScreen } from '@/components/game/results-screen'
import { JoinRoomForm } from '@/components/game/join-room-form'
import { Skeleton } from '@/components/ui/skeleton'

type GamePhase = 'joining' | 'lobby' | 'reveal' | 'voting' | 'vote_conclusion' | 'vote_result' | 'game_over' | 'room_ended'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const supabase = useSupabaseBrowser()
  const clientId = getClientId()

  const [phase, setPhase] = useState<GamePhase>('joining')
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [game, setGame] = useState<Game | null>(null)
  const [currentRound, setCurrentRound] = useState<Round | null>(null)
  const [gamePlayers, setGamePlayers] = useState<GamePlayerWithPlayer[]>([])
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true)
  const [roomError, setRoomError] = useState<boolean>(false)

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    console.log('[RoomPage] Fetching room...')
    try {
      const { data, error } = await getRoomByCode(supabase, code)
      if (error) {
        console.error('[RoomPage] Error fetching room:', error)
        setRoomError(true)
        return
      }
      console.log('[RoomPage] Room fetched:', data)
      setRoom(data as Room)
    } catch (e) {
      console.error('[RoomPage] Exception fetching room:', e)
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

  // Fetch active game and related data
  const fetchGameData = useCallback(async () => {
    if (!room?.id) return
    console.log('[RoomPage] Fetching game data for room:', room.id)

    const { data: activeGame } = await getActiveGame(room.id)
    console.log('[RoomPage] Active game:', activeGame)
    setGame(activeGame)

    if (activeGame) {
      // Fetch game players
      const { data: gp } = await getGamePlayers(activeGame.id)
      setGamePlayers(gp || [])

      // Fetch current round
      const { data: round } = await getCurrentRound(activeGame.id, activeGame.current_round)
      setCurrentRound(round)
    } else {
      setGamePlayers([])
      setCurrentRound(null)
    }
  }, [room?.id])

  // Initial fetch
  useEffect(() => {
    fetchRoom()
  }, [fetchRoom])

  // Fetch players and game when room is available
  useEffect(() => {
    if (room?.id) {
      fetchPlayers()
      fetchGameData()
    }
  }, [room?.id, fetchPlayers, fetchGameData])

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

  // Realtime subscription for games
  useEffect(() => {
    if (!room?.id) return

    const channel = supabase
      .channel(`games-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          fetchGameData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, room?.id, fetchGameData])

  // Realtime subscription for rounds
  useEffect(() => {
    if (!game?.id) return

    const channel = supabase
      .channel(`rounds-${game.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
          filter: `game_id=eq.${game.id}`,
        },
        () => {
          fetchGameData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, game?.id, fetchGameData])

  // Find current player
  const currentPlayer = players.find((p) => p.client_id === clientId) ?? null
  const isHost = room?.host_id === clientId

  // Find current game player info
  const currentGamePlayer = gamePlayers.find((gp) => gp.player_id === currentPlayer?.id)

  // Handle navigation on error
  useEffect(() => {
    if (roomError) {
      router.push('/')
    }
  }, [roomError, router])

  // Refs to track current state for cleanup
  const roomRef = useRef<Room | null>(null)
  const playerRef = useRef<Player | null>(null)

  // Update refs
  useEffect(() => {
    roomRef.current = room
    // Find current player in the updated list
    const p = players.find((p) => p.client_id === clientId) ?? null
    playerRef.current = p
  }, [room, players, clientId])

  // // Cleanup player when browser/tab is closed OR component unmounts
  // useEffect(() => {
  //   const handleLeave = () => {
  //     const roomToRemove = roomRef.current
  //     const playerToRemove = playerRef.current

  //     if (!roomToRemove?.id || !playerToRemove?.id) return

  //     const data = {
  //       playerId: playerToRemove.id,
  //       roomId: roomToRemove.id,
  //     }

  //     // Use fetch with keepalive for more reliable execution during unloads/navigation
  //     // sendBeacon can have issues with headers or be tricky to debug
  //     fetch('/api/leave-room', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(data),
  //       keepalive: true,
  //     }).catch((err) => console.error('Failed to leave room:', err))
  //   }

  //   window.addEventListener('pagehide', handleLeave)

  //   return () => {
  //     window.removeEventListener('pagehide', handleLeave)
  //     handleLeave()
  //   }
  // }, [])



  // Local state for role acknowledgement
  const [hasAckedRound, setHasAckedRound] = useState(false)

  // Load/Save acknowledgement from localStorage
  useEffect(() => {
    if (!game?.id || !currentRound?.id) return

    const key = `impostor_ack_${game.id}_${currentRound.id}`
    const savedAck = localStorage.getItem(key) === 'true'
    setHasAckedRound(savedAck)
  }, [game?.id, currentRound?.id])

  const handleAckRound = useCallback(() => {
    if (!game?.id || !currentRound?.id) return
    const key = `impostor_ack_${game.id}_${currentRound.id}`
    localStorage.setItem(key, 'true')
    setHasAckedRound(true)
  }, [game?.id, currentRound?.id])

  // Reset local Ack when round changes
  useEffect(() => {
    // Logic handled by key change in useEffect above, but we explicit reset for clarity if needed
    // Actually the first useEffect handles reading the new key which defaults to false (null)
  }, [game?.id, currentRound?.id])


  // Calculate phase
  useEffect(() => {
    if (!room) return

    let newPhase: GamePhase
    if (!currentPlayer) {
      newPhase = 'joining'
    } else if (room.status === 'game_finished') {
      newPhase = 'room_ended'
    } else if (!game) {
      newPhase = 'lobby'
    } else if (game.status === 'game_over') {
      newPhase = 'game_over'
    } else {
      // Map game status directly to phase
      if (game.status === 'reveal') {
        // If user already clicked "Ready", show voting screen
        // But only if we have a current round
        if (hasAckedRound) {
          newPhase = 'voting'
        } else {
          newPhase = 'reveal'
        }
      }
      else if (game.status === 'voting') newPhase = 'voting'
      else if (game.status === 'vote_conclusion') newPhase = 'vote_conclusion'
      else if (game.status === 'vote_result') newPhase = 'vote_result'
      else newPhase = 'lobby'
    }
    console.log('[RoomPage] Calculated phase:', newPhase, { roomStatus: room.status, gameStatus: game?.status, hasAckedRound })
    setPhase(newPhase)
  }, [room, currentPlayer, game, hasAckedRound])



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
          onGameStart={() => {
            console.log('[RoomPage] Game start triggered in Lobby, refreshing data...')
            fetchRoom()
            fetchGameData()
          }}
        />
      )}

      {phase === 'reveal' && game && currentRound && (
        <GameScreen
          room={room}
          game={game}
          currentRound={currentRound}
          gamePlayers={gamePlayers}
          currentPlayer={currentPlayer}
          currentGamePlayer={currentGamePlayer ?? null}
          isHost={isHost}
          onReady={() => {
            handleAckRound()
            fetchGameData()
          }}
        />
      )}

      {(phase === 'voting' || phase === 'vote_result') && game && currentRound && (
        <VotingScreen
          room={room}
          game={game}
          currentRound={currentRound}
          gamePlayers={gamePlayers}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onRoundEnd={fetchGameData}
        />
      )}

      {phase === 'vote_conclusion' && game && currentRound && (
        <VoteConclusionScreen
          room={room}
          game={game}
          currentRound={currentRound}
          gamePlayers={gamePlayers}
          currentPlayer={currentPlayer}
          isHost={isHost}
        />
      )}



      {(phase === 'game_over' || phase === 'room_ended') && game && (
        <ResultsScreen
          room={room}
          game={game}
          gamePlayers={gamePlayers}
          players={players}
          onPlayAgain={fetchGameData}
        />
      )}
    </main>
  )
}
