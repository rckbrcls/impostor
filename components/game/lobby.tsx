'use client'

import { useEffect, useState } from 'react'
import { supabase, type Player, type Room } from '@/lib/supabase'
import { getClientId } from '@/lib/game-utils'
import { getRandomWord } from '@/lib/words'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Play, Users } from 'lucide-react'

interface LobbyProps {
  room: Room
  players: Player[]
  onGameStart: () => void
}

export function Lobby({ room, players, onGameStart }: LobbyProps) {
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const clientId = getClientId()
  const isHost = room.host_id === clientId
  const isDev = process.env.NODE_ENV === 'development'
  const minPlayers = isDev ? 1 : 3
  const canStart = players.length >= minPlayers

  const copyLink = async () => {
    const link = `${window.location.origin}/room/${room.code}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startGame = async () => {
    if (!canStart || !isHost) return

    setIsStarting(true)
    try {
      // Sortear impostor
      const impostorIndex = Math.floor(Math.random() * players.length)
      const impostorId = players[impostorIndex].id

      // Resetar todos para não-impostor
      await supabase
        .from('players')
        .update({ is_impostor: false })
        .eq('room_id', room.id)

      // Marcar o impostor
      await supabase
        .from('players')
        .update({ is_impostor: true })
        .eq('id', impostorId)

      // Atualizar sala
      await supabase
        .from('rooms')
        .update({
          status: 'playing',
          round: room.round + 1,
          word: getRandomWord(),
        })
        .eq('id', room.id)

      onGameStart()
    } catch (error) {
      console.error('Erro ao iniciar jogo:', error)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Users /> Sala {room.code}
        </CardTitle>
        <CardDescription>
          {canStart
            ? 'Pronto para começar!'
            : `Aguardando jogadores... (${players.length}/${minPlayers} mínimo)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de jogadores */}
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">
            Jogadores ({players.length})
          </p>
          <ul className="space-y-2">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-2 bg-background rounded-md px-3 py-2"
              >
                <span className="text-lg">
                  {player.client_id === room.host_id ? '👑' : '🎮'}
                </span>
                <span className="font-medium">{player.name}</span>
                {player.client_id === clientId && (
                  <span className="text-xs text-muted-foreground">(você)</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={copyLink}>
            {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
            {copied ? 'Copiado!' : 'Compartilhar'}
          </Button>

          {isHost && (
            <Button
              className="flex-1"
              onClick={startGame}
              disabled={!canStart || isStarting}
            >
              <Play className="mr-2" />
              {isStarting ? 'Iniciando...' : 'Começar'}
            </Button>
          )}
        </div>

        {!isHost && (
          <p className="text-center text-sm text-muted-foreground">
            Aguardando o host iniciar o jogo...
          </p>
        )}
      </CardContent>
    </Card>
  )
}
