'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSupabaseBrowser from '@/lib/supabase/browser'
import {
  type Player,
  type Room,
  type Game,
  type GamePlayerWithPlayer,
  createGame,
  createGamePlayers,
  setImpostor,
  createRound,
  updateRoomStatus,
  getRoundsByGame
} from '@/lib/supabase'
import { getClientId } from '@/lib/game-utils'
import { getRandomWord } from '@/lib/words'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Home, RotateCcw, Skull, Users, VenetianMask } from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

interface ResultsScreenProps {
  room: Room
  game: Game
  gamePlayers: GamePlayerWithPlayer[]
  players: Player[]
  onPlayAgain: () => void
}

export function ResultsScreen({ room, game, gamePlayers, players, onPlayAgain }: ResultsScreenProps) {
  const router = useRouter()
  const supabase = useSupabaseBrowser()
  const { t } = useLanguage()
  const [isResetting, setIsResetting] = useState(false)
  const [impostorWon, setImpostorWon] = useState<boolean>(false)

  // Find the impostor
  const impostorGp = gamePlayers.find((gp) => gp.is_impostor)
  const impostor = impostorGp?.player

  useEffect(() => {
    async function checkWinner() {
      if (!impostor) return

      // Fetch all rounds to see if impostor was eliminated
      const { data: rounds } = await getRoundsByGame(game.id)

      const wasEliminated = rounds.some(r => r.eliminated_player_id === impostor.id)

      // Impostor wins if they were NOT eliminated
      // (Even if game ended by vote 1v1, they weren't eliminated in that vote, someone else was, or game ended by action)
      // The only way Impostor loses is if they were eliminated.
      setImpostorWon(!wasEliminated)
    }

    checkWinner()
  }, [game.id, impostor])

  const goHome = () => {
    router.push('/')
  }

  const clientId = getClientId()
  const isHost = room.host_id === clientId

  const playAgain = async () => {
    if (!isHost) return

    setIsResetting(true)
    try {
      // Create a new game (instead of resetting)
      const word = getRandomWord()
      const { data: newGame, error: gameError } = await createGame(room.id, word)

      if (gameError || !newGame) {
        console.error('Error creating game:', gameError)
        return
      }

      // Create game_players for all current players
      const playerIds = players.map(p => p.id)
      const { error: gpError } = await createGamePlayers(newGame.id, playerIds)

      if (gpError) {
        console.error('Error creating game players:', gpError)
        return
      }

      // Pick random impostor
      const impostorIndex = Math.floor(Math.random() * players.length)
      const impostorId = players[impostorIndex].id
      await setImpostor(newGame.id, impostorId)

      // Create first round
      await createRound(newGame.id, 1)

      onPlayAgain()
    } catch (error) {
      console.error('Erro ao reiniciar jogo:', error)
    } finally {
      setIsResetting(false)
    }
  }

  const endSession = async () => {
    if (!isHost) return
    try {
      await updateRoomStatus(room.id, 'game_finished')
      // UI will update automatically via realtime -> page -> phase -> results screen prop update
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error)
    }
  }

  // If room is finished, show global ranking
  if (room.status === 'game_finished') {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Trophy className="text-yellow-500" />
            {t('results.ranking_title', 'Ranking Final')}
          </CardTitle>
          <CardDescription>
            {t('results.session_ended', 'Sessão encerrada')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            {sortedPlayers.map((p, index) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 border-2 border-black dark:border-white shadow-[2px_2px_0_0] ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-white dark:bg-zinc-900'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center size-8 rounded-full font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' : 'bg-accent text-muted-foreground'
                    }`}>
                    {index + 1}
                  </span>
                  <span className="font-bold">{p.name} {p.client_id === clientId && '(você)'}</span>
                </div>
                <span className="font-mono font-bold text-lg">{p.score} pts</span>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={goHome}>
            <Home className="mr-2 size-4" />
            {t('results.home')}
          </Button>
        </CardContent>
      </Card>
    )
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
          {t('results.rounds_played', game.current_round, game.current_round !== 1 ? 's' : '')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Word reveal */}
        <div className="bg-primary/10 p-6 text-center border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white">
          <p className="text-sm text-muted-foreground mb-2">{t('results.word_was')}</p>
          <p className="text-3xl font-bold text-primary uppercase">
            {game.word}
          </p>
        </div>

        {/* Impostor reveal */}
        <div className={`p-4 text-center border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white ${impostorWon
          ? 'bg-red-500/20'
          : 'bg-green-500/20'
          }`}>
          <p className="text-sm text-muted-foreground mb-1">{t('results.impostor_was')}</p>
          <p className="text-2xl font-bold flex items-center justify-center gap-2">
            <VenetianMask className="size-8" />
            {impostor?.name ?? t('results.unknown')}
          </p>
          {impostorWon && (
            <p className="text-sm text-red-400 mt-2">
              {t('results.survived_rounds', game.current_round, game.current_round !== 1 ? 's' : '')}
            </p>
          )}
        </div>

        {/* Players in this game */}
        <div className="border-2 border-black shadow-[2px_2px_0_0] dark:border-white dark:shadow-white p-4">
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Users className="size-4" />
            {t('lobby.players_title', gamePlayers.length)}
          </p>
          <div className="flex flex-wrap gap-2">
            {gamePlayers.map((gp) => (
              <span
                key={gp.id}
                className={`px-3 py-1 text-sm border-2 border-black dark:border-white font-semibold ${gp.is_impostor
                  ? 'bg-red-500/20 text-red-500'
                  : 'bg-white dark:bg-zinc-900'
                  }`}
              >
                {gp.player?.name ?? 'Unknown'}
                {gp.is_impostor && <VenetianMask className="inline size-4 ml-1" />}
              </span>
            ))}
          </div>
        </div>

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

        {isHost && (
          <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={endSession}>
            {t('results.end_session', 'Encerrar Sessão')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
