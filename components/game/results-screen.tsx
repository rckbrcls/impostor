'use client'

import { useRouter } from 'next/navigation'
import { supabase, type Player, type Room } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Home, RotateCcw } from 'lucide-react'

interface ResultsScreenProps {
  room: Room
  players: Player[]
}

export function ResultsScreen({ room, players }: ResultsScreenProps) {
  const router = useRouter()

  // Ordenar por pontuação
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  const getMedal = (index: number) => {
    switch (index) {
      case 0:
        return '🥇'
      case 1:
        return '🥈'
      case 2:
        return '🥉'
      default:
        return `${index + 1}º`
    }
  }

  const goHome = () => {
    router.push('/')
  }

  const playAgain = async () => {
    try {
      // Resetar pontuações
      await supabase
        .from('players')
        .update({ score: 0, is_impostor: false })
        .eq('room_id', room.id)

      // Voltar sala para waiting
      await supabase
        .from('rooms')
        .update({ status: 'waiting', round: 0, word: null })
        .eq('id', room.id)
    } catch (error) {
      console.error('Erro ao reiniciar jogo:', error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Trophy className="text-yellow-500" />
          Ranking Final
        </CardTitle>
        <CardDescription>
          {room.round} rodadas jogadas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ranking */}
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg ${index === 0
                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30'
                  : 'bg-muted'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getMedal(index)}</span>
                <span className={`font-medium ${index === 0 ? 'text-lg' : ''}`}>
                  {player.name}
                </span>
              </div>
              <div className="flex items-center gap-1 font-bold">
                <Medal className="size-4" />
                {player.score} pts
              </div>
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={goHome}>
            <Home className="mr-2" />
            Início
          </Button>
          <Button className="flex-1" onClick={playAgain}>
            <RotateCcw className="mr-2" />
            Jogar Novamente
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
