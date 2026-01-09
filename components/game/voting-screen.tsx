'use client'

import { useState } from 'react'
import { supabase, type Player, type Room } from '@/lib/supabase'
import { getRandomWord } from '@/lib/words'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, Play, Flag, Eye } from 'lucide-react'

interface VotingScreenProps {
  room: Room
  players: Player[]
  onNextRound: () => void
  onEndGame: () => void
}

export function VotingScreen({ room, players, onNextRound, onEndGame }: VotingScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [revealImpostor, setRevealImpostor] = useState(false)

  const impostor = players.find((p) => p.is_impostor)

  const givePoint = async (playerId: string) => {
    setIsLoading(true)
    try {
      const player = players.find((p) => p.id === playerId)
      if (!player) return

      await supabase
        .from('players')
        .update({ score: player.score + 1 })
        .eq('id', playerId)
    } catch (error) {
      console.error('Erro ao dar ponto:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startNextRound = async () => {
    setIsLoading(true)
    try {
      // Sortear novo impostor
      const impostorIndex = Math.floor(Math.random() * players.length)
      const impostorId = players[impostorIndex].id

      // Resetar todos para não-impostor
      await supabase
        .from('players')
        .update({ is_impostor: false })
        .eq('room_id', room.id)

      // Marcar o novo impostor
      await supabase
        .from('players')
        .update({ is_impostor: true })
        .eq('id', impostorId)

      // Atualizar sala com nova rodada e palavra
      await supabase
        .from('rooms')
        .update({
          round: room.round + 1,
          word: getRandomWord(),
        })
        .eq('id', room.id)

      setRevealImpostor(false)
      onNextRound()
    } catch (error) {
      console.error('Erro ao iniciar próxima rodada:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const endGame = async () => {
    setIsLoading(true)
    try {
      await supabase
        .from('rooms')
        .update({ status: 'ended' })
        .eq('id', room.id)

      onEndGame()
    } catch (error) {
      console.error('Erro ao finalizar jogo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Rodada {room.round} - Votação</CardTitle>
        <CardDescription>
          A palavra era: <strong className="text-foreground">{room.word}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revelar impostor */}
        <div className="bg-muted rounded-lg p-4 text-center">
          {revealImpostor ? (
            <>
              <p className="text-sm text-muted-foreground mb-1">O impostor era:</p>
              <p className="text-2xl font-bold text-red-400">
                🕵️ {impostor?.name}
              </p>
            </>
          ) : (
            <Button variant="outline" onClick={() => setRevealImpostor(true)}>
              <Eye className="mr-2" />
              Revelar Impostor
            </Button>
          )}
        </div>

        {/* Dar pontos */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Quem ganhou esta rodada?
          </p>
          <div className="grid gap-2">
            {players.map((player) => (
              <Button
                key={player.id}
                variant="outline"
                className="justify-between"
                onClick={() => givePoint(player.id)}
                disabled={isLoading}
              >
                <span className="flex items-center gap-2">
                  {player.is_impostor && revealImpostor && '🕵️'}
                  {player.name}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="size-4" />
                  {player.score} pts
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={endGame}
            disabled={isLoading}
          >
            <Flag className="mr-2" />
            Finalizar
          </Button>
          <Button
            className="flex-1"
            onClick={startNextRound}
            disabled={isLoading}
          >
            <Play className="mr-2" />
            Rodada {room.round + 1}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
