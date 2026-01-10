'use client'

import { useRouter } from 'next/navigation'
import { type Player, type Room } from '@/lib/supabase'
import { getClientId } from '@/lib/game-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Home, RotateCcw, Skull, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  useDeleteVotesByRoom,
  useResetPlayersForGame,
  useResetRoom,
} from '@/queries'

interface ResultsScreenProps {
  room: Room
  players: Player[]
}

export function ResultsScreen({ room, players }: ResultsScreenProps) {
  const router = useRouter()
  const { t } = useLanguage()

  const deleteVotesMutation = useDeleteVotesByRoom()
  const resetPlayersMutation = useResetPlayersForGame()
  const resetRoomMutation = useResetRoom()

  // Find the impostor
  const impostor = players.find((p) => p.is_impostor)

  // Active players (not eliminated)
  const activePlayers = players.filter((p) => !p.is_eliminated)

  // Eliminated players
  const eliminatedPlayers = players.filter((p) => p.is_eliminated)

  // Impostor won if still active and only 2 players remain
  const impostorWon = impostor && !impostor.is_eliminated && activePlayers.length <= 2

  const goHome = () => {
    router.push('/')
  }

  const clientId = getClientId()
  const isHost = room.host_id === clientId

  const isResetting =
    deleteVotesMutation.isPending ||
    resetPlayersMutation.isPending ||
    resetRoomMutation.isPending

  const playAgain = async () => {
    if (!isHost) return

    try {
      // 0. Proactive Cleanup
      await deleteVotesMutation.mutateAsync(room.id)

      // 1. Reset all player status
      await resetPlayersMutation.mutateAsync(room.id)

      // 2. Reset room to waiting (Lobby)
      await resetRoomMutation.mutateAsync(room.id)
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
        {/* Word reveal */}
        <div className="bg-primary/10 p-6 text-center border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white">
          <p className="text-sm text-muted-foreground mb-2">{t('results.word_was')}</p>
          <p className="text-3xl font-bold text-primary uppercase">
            {room.word}
          </p>
        </div>

        {/* Impostor reveal */}
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

        {/* Eliminated players */}
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

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={goHome}>
            <Home className="mr-2" />
            {t('results.home')}
          </Button>
          {isHost && (
            <Button className="flex-1" onClick={playAgain} disabled={isResetting}>
              <RotateCcw className="mr-2" />
              {t('results.play_again')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
