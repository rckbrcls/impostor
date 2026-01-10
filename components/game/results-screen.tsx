'use client'

import { useRouter } from 'next/navigation'
import {
  deleteVotesByRoomId,
  resetPlayersForNewGame,
  resetRoomToWaiting,
  type Player,
  type Room,
} from '@/lib/supabase'
import { getClientId } from '@/lib/game-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Home, RotateCcw, Skull, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-context'

interface ResultsScreenProps {
  room: Room
  players: Player[]
}

export function ResultsScreen({ room, players }: ResultsScreenProps) {
  const router = useRouter()
  const { t } = useLanguage()

  // Encontrar o impostor
  const impostor = players.find((p) => p.is_impostor)

  // Jogadores ativos (não eliminados)
  const activePlayers = players.filter((p) => !p.is_eliminated)

  // Jogadores eliminados
  const eliminatedPlayers = players.filter((p) => p.is_eliminated)

  // O impostor venceu se ele ainda está ativo e restam apenas 2 jogadores ativos
  const impostorWon = impostor && !impostor.is_eliminated && activePlayers.length <= 2

  const goHome = () => {
    router.push('/')
  }

  const clientId = getClientId()
  const isHost = room.host_id === clientId

  const playAgain = async () => {
    if (!isHost) return

    try {
      // 0. Proactive Cleanup: Tentar limpar votos aqui também
      await deleteVotesByRoomId(room.id)

      // 1. Resetar status de todos os jogadores (pontuação, impostor, etc)
      await resetPlayersForNewGame(room.id)

      // 2. Voltar sala para 'waiting' (Lobby)
      // O Lobby vai lidar com a limpeza de votos de cada jogador (best effort)
      // E o jogo continuará incrementando o round (Round 1 -> 2 -> 3...) para evitar colisão de votos
      await resetRoomToWaiting(room.id)
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
              {t('results.impostor_won')}
            </>
          ) : (
            <>
              <Trophy className="text-yellow-500" />
              {t('results.players_won')}
            </>
          )}
        </CardTitle>
        <CardDescription>
          {t('results.rounds_played', room.round, room.round !== 1 ? 's' : '')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revelação da palavra */}
        {/* Revelação da palavra */}
        <div className="bg-primary/10 p-6 text-center border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white">
          <p className="text-sm text-muted-foreground mb-2">{t('results.word_was')}</p>
          <p className="text-3xl font-bold text-primary uppercase">
            {room.word}
          </p>
        </div>

        {/* Quem era o impostor */}
        {/* Quem era o impostor */}
        <div className={`p-4 text-center border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white ${impostorWon
          ? 'bg-red-500/20'
          : 'bg-green-500/20'
          }`}>
          <p className="text-sm text-muted-foreground mb-1">{t('results.impostor_was')}</p>
          <p className="text-2xl font-bold">
            🕵️ {impostor?.name ?? t('results.unknown')}
          </p>
          {impostorWon && (
            <p className="text-sm text-red-400 mt-2">
              {t('results.survived_rounds', room.round, room.round !== 1 ? 's' : '')}
            </p>
          )}
        </div>

        {/* Jogadores eliminados */}
        {eliminatedPlayers.length > 0 && (
          <div className="border-2 border-black shadow-[2px_2px_0_0] dark:border-white dark:shadow-white p-4">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Users className="size-4" />
              {t('results.eliminated_title')}
            </p>
            <div className="flex flex-wrap gap-2">
              {eliminatedPlayers.map((player) => (
                <span
                  key={player.id}
                  className="px-3 py-1 text-sm bg-red-500/20 text-red-500 border-2 border-black dark:border-white font-semibold"
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
            {t('results.home')}
          </Button>
          {isHost && (
            <Button className="flex-1" onClick={playAgain}>
              <RotateCcw className="mr-2" />
              {t('results.play_again')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
