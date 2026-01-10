'use client'

import { useEffect, useState } from 'react'
import copy from 'copy-to-clipboard'
import { type Player, type Room } from '@/lib/supabase'
import { getClientId } from '@/lib/game-utils'
import { getRandomWord } from '@/lib/words'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Play, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  useDeleteVotesByRoom,
  useResetPlayersForRound,
  useSetImpostor,
  useStartGame,
} from '@/queries'

interface LobbyProps {
  room: Room
  players: Player[]
  onGameStart: () => void
}

export function Lobby({ room, players, onGameStart }: LobbyProps) {
  const [copied, setCopied] = useState(false)
  const clientId = getClientId()
  const isHost = room.host_id === clientId
  const isDev = process.env.NODE_ENV === 'development'
  const minPlayers = isDev ? 1 : 3
  const canStart = players.length >= minPlayers
  const { t } = useLanguage()

  const deleteVotesMutation = useDeleteVotesByRoom()
  const resetPlayersMutation = useResetPlayersForRound()
  const setImpostorMutation = useSetImpostor()
  const startGameMutation = useStartGame()

  const isStarting =
    deleteVotesMutation.isPending ||
    resetPlayersMutation.isPending ||
    setImpostorMutation.isPending ||
    startGameMutation.isPending

  // Clean old votes when entering lobby
  useEffect(() => {
    const cleanVotes = async () => {
      const myPlayer = players.find((p) => p.client_id === clientId)
      if (!myPlayer) return

      try {
        console.log('[Lobby] Cleaning votes for player:', myPlayer.name)
        if (isHost) {
          await deleteVotesMutation.mutateAsync(room.id)
        }
        console.log('[Lobby] Cleanup success')
      } catch (err) {
        console.error('[Lobby] Error cleaning votes:', err)
      }
    }

    cleanVotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, isHost])

  const copyLink = () => {
    const link = `${window.location.origin}/room/${room.code}`
    copy(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startGame = async () => {
    if (!canStart || !isHost) return

    try {
      // Force cleanup: Host cleans all votes before starting
      console.log('[Lobby] Host starting game, force cleaning all votes...')
      await deleteVotesMutation.mutateAsync(room.id)

      // Pick impostor
      const impostorIndex = Math.floor(Math.random() * players.length)
      const impostorId = players[impostorIndex].id

      // Reset all players
      await resetPlayersMutation.mutateAsync(room.id)

      // Mark the impostor
      await setImpostorMutation.mutateAsync({ playerId: impostorId, roomId: room.id })

      // Update room
      await startGameMutation.mutateAsync({
        roomId: room.id,
        round: room.round + 1,
        word: getRandomWord(),
      })

      onGameStart()
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Users /> {t('lobby.room')} {room.code}
        </CardTitle>
        <CardDescription>
          {canStart
            ? t('lobby.ready')
            : t('lobby.waiting', players.length, minPlayers)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Player list */}
        <div className="border-2 border-black dark:border-white shadow-[4px_4px_0_0] dark:shadow-white p-4">
          <p className="text-sm text-muted-foreground mb-2">
            {t('lobby.players_title', players.length)}
          </p>
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-2 border-2 border-black dark:border-white shadow-[2px_2px_0_0] dark:shadow-white bg-white dark:bg-zinc-900 px-3 py-2"
              >
                <span className="text-lg">
                  {player.client_id === room.host_id ? '👑' : '🎮'}
                </span>
                <span className="font-medium">{player.name}</span>
                {player.client_id === clientId && (
                  <span className="text-xs text-muted-foreground">{t('common.you')}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={copyLink}>
            {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
            {copied ? t('common.copied') : t('lobby.share')}
          </Button>

          {isHost && (
            <Button
              className="flex-1"
              onClick={startGame}
              disabled={!canStart || isStarting}
            >
              <Play className="mr-2" />
              {isStarting ? t('lobby.starting') : t('lobby.start')}
            </Button>
          )}
        </div>

        {!isHost && (
          <p className="text-center text-sm text-muted-foreground">
            {t('lobby.waiting_host')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
