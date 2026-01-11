'use client'

import { useEffect, useState } from 'react'
import copy from 'copy-to-clipboard'
import { useRouter } from 'next/navigation'
import useSupabaseBrowser from '@/lib/supabase/browser'
import {
  type Player,
  type Room,
  createGame,
  createGamePlayers,
  setImpostor,
  createRound
} from '@/lib/supabase'
import { getClientId } from '@/lib/game-utils'
import { getRandomWord } from '@/lib/words'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Play, Users, LogOut } from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

interface LobbyProps {
  room: Room
  players: Player[]
  onGameStart: () => void
}

export function Lobby({ room, players, onGameStart }: LobbyProps) {
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const router = useRouter()
  const supabase = useSupabaseBrowser()
  const clientId = getClientId()
  const isHost = room.host_id === clientId
  const isDev = process.env.NODE_ENV === 'development'
  const minPlayers = isDev ? 1 : 3
  const canStart = players.length >= minPlayers
  const { t } = useLanguage()

  const copyLink = () => {
    const link = `${window.location.origin}/room/${room.code}`
    copy(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startGame = async () => {
    if (!canStart || !isHost) return

    setIsStarting(true)
    try {
      // 1. Create a new game
      const word = getRandomWord()
      const { data: newGame, error: gameError } = await createGame(room.id, word)

      if (gameError || !newGame) {
        console.error('Error creating game:', gameError)
        return
      }

      // 2. Create game_players for all players
      const playerIds = players.map(p => p.id)
      const { error: gpError } = await createGamePlayers(newGame.id, playerIds)

      if (gpError) {
        console.error('Error creating game players:', gpError)
        return
      }

      // 3. Pick random impostor
      const impostorIndex = Math.floor(Math.random() * players.length)
      const impostorId = players[impostorIndex].id
      await setImpostor(newGame.id, impostorId)

      // 4. Create first round
      await createRound(newGame.id, 1)

      onGameStart()
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleLeave = async () => {
    const myPlayer = players.find((p) => p.client_id === clientId)
    if (!myPlayer) return

    setIsLeaving(true)
    try {
      // Se for o host, transferir para o próximo jogador mais antigo antes de sair
      if (isHost && players.length > 1) {
        const nextHost = players.find((p) => p.client_id !== clientId)
        if (nextHost) {
          await supabase
            .from('rooms')
            .update({ host_id: nextHost.client_id })
            .eq('id', room.id)
        }
      }

      // Delete the player
      await supabase.from('players').delete().eq('id', myPlayer.id)

      // Check if room is now empty and should be deleted
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)

      if (count === 0) {
        // Cascade will handle games, rounds, votes
        await supabase.from('rooms').delete().eq('id', room.id)
      }

      router.push('/')
    } catch (error) {
      console.error('Erro ao sair da sala:', error)
    } finally {
      setIsLeaving(false)
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

        {/* Leave Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLeave}
          disabled={isLeaving}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLeaving ? t('lobby.leaving') : t('lobby.leave')}
        </Button>
      </CardContent>
    </Card>
  )
}
