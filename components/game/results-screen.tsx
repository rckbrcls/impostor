'use client'

import { useRouter } from 'next/navigation'
import { supabase, type Player, type Room } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Home, RotateCcw, Skull, Users } from 'lucide-react'

interface ResultsScreenProps {
  room: Room
  players: Player[]
}

export function ResultsScreen({ room, players }: ResultsScreenProps) {
  const router = useRouter()

  // Encontrar o impostor
  const impostor = players.find((p) => p.is_impostor)

  // Jogadores ativos (não eliminados)
  const activePlayers = players.filter((p) => !p.is_eliminated)

  // Jogadores eliminados
  const eliminatedPlayers = players.filter((p) => p.is_eliminated)

  // O impostor venceu se ele ainda está ativo e restam apenas 2 jogadores ativos
  const impostorWon = impostor && !impostor.is_eliminated && activePlayers.length <= 2

  // O impostor perdeu se foi eliminado
  const impostorLost = impostor?.is_eliminated ?? false

  const goHome = () => {
    router.push('/')
  }

  const playAgain = async () => {
    try {
      // Limpar votos antigos
      await supabase
        .from('votes')
        .delete()
        .eq('room_id', room.id)

      // Resetar jogadores
      await supabase
        .from('players')
        .update({ score: 0, is_impostor: false, is_eliminated: false })
        .eq('room_id', room.id)

      // Voltar sala para playing (nova partida)
      await supabase
        .from('rooms')
        .update({ status: 'playing', round: 1, word: null })
        .eq('id', room.id)
    } catch (error) {
      console.error('Erro ao reiniciar jogo:', error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          {impostorWon ? (
            <>
              <Skull className="text-red-500" />
              O Impostor Venceu!
            </>
          ) : (
            <>
              <Trophy className="text-yellow-500" />
              Jogadores Venceram!
            </>
          )}
        </CardTitle>
        <CardDescription>
          {room.round} rodada{room.round !== 1 ? 's' : ''} jogada{room.round !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revelação da palavra */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-6 text-center border-2 border-primary/30">
          <p className="text-sm text-muted-foreground mb-2">A palavra era:</p>
          <p className="text-3xl font-bold text-primary uppercase">
            {room.word}
          </p>
        </div>

        {/* Quem era o impostor */}
        <div className={`rounded-xl p-4 text-center border-2 ${impostorWon
          ? 'bg-gradient-to-br from-red-500/20 to-rose-600/30 border-red-500/50'
          : 'bg-gradient-to-br from-green-500/20 to-emerald-600/30 border-green-500/50'
          }`}>
          <p className="text-sm text-muted-foreground mb-1">O impostor era:</p>
          <p className="text-2xl font-bold">
            🕵️ {impostor?.name ?? 'Desconhecido'}
          </p>
          {impostorWon && (
            <p className="text-sm text-red-400 mt-2">
              Sobreviveu por {room.round} rodada{room.round !== 1 ? 's' : ''}!
            </p>
          )}
        </div>

        {/* Jogadores eliminados */}
        {eliminatedPlayers.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Users className="size-4" />
              Eliminados durante o jogo:
            </p>
            <div className="flex flex-wrap gap-2">
              {eliminatedPlayers.map((player) => (
                <span
                  key={player.id}
                  className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/30"
                >
                  {player.name}
                </span>
              ))}
            </div>
          </div>
        )}

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
