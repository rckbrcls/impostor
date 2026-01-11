'use client'

import { useState, useEffect } from 'react'
import useSupabaseBrowser from '@/lib/supabase/browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  type Player,
  type Room,
  type Game,
  type Round,
  type GamePlayerWithPlayer,
  updateGameStatus,
  getRoundsByGame
} from '@/lib/supabase'
import { getClientId } from '@/lib/game-utils'
import { Vote } from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

interface GameScreenProps {
  room: Room
  game: Game
  currentRound: Round
  gamePlayers: GamePlayerWithPlayer[]
  currentPlayer: Player | null
  currentGamePlayer: { is_impostor: boolean } | null
  isHost: boolean
  onReady: () => void
}

export function GameScreen({
  room,
  game,
  currentRound,
  gamePlayers,
  currentPlayer,
  currentGamePlayer,
  isHost,
  onReady
}: GameScreenProps) {
  const supabase = useSupabaseBrowser()
  const clientId = getClientId()
  const isImpostor = currentGamePlayer?.is_impostor ?? false
  const { t } = useLanguage()

  // Get eliminated players from previous rounds
  const [eliminatedPlayerIds, setEliminatedPlayerIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchEliminatedPlayers() {
      const { data: rounds } = await getRoundsByGame(game.id)
      const eliminated = new Set<string>()
      rounds.forEach((r) => {
        if (r.eliminated_player_id) {
          eliminated.add(r.eliminated_player_id)
        }
      })
      setEliminatedPlayerIds(eliminated)
    }

    fetchEliminatedPlayers()
  }, [game.id, game.current_round])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {t('game.round', game.current_round)}
        </CardTitle>
        <CardDescription>
          {t('game.players_count', gamePlayers.length)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className={`p-8 text-center border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white ${isImpostor
          ? 'bg-red-500/20'
          : 'bg-green-500/20'
          }`}>
          {isImpostor ? (
            <>
              <p className="text-6xl mb-4">🕵️</p>
              <p className="text-3xl font-bold text-red-400">
                {t('game.impostor_title')}
              </p>
              <p className="text-muted-foreground mt-2">
                {t('game.impostor_desc')}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">{t('game.word_label')}</p>
              <p className="text-4xl font-bold text-green-400 uppercase">
                {game.word}
              </p>
              <p className="text-muted-foreground mt-3 text-sm">
                {t('game.word_desc')}
              </p>
            </>
          )}
        </div>

        {/* Player list */}
        <div className="border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white p-4">
          <p className="text-sm text-muted-foreground mb-2 text-center">
            {t('game.players_round')}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {gamePlayers.map((gp) => {
              const isEliminated = eliminatedPlayerIds.has(gp.player_id)
              return (
                <span
                  key={gp.id}
                  className={`px-3 py-1 text-sm border-2 border-black dark:border-white font-semibold ${isEliminated
                    ? 'bg-red-500/20 text-red-500 line-through opacity-60'
                    : gp.player_id === currentPlayer?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white dark:bg-zinc-900'
                    }`}
                >
                  {gp.player?.name ?? 'Unknown'}
                  {isEliminated && ` ${t('game.eliminated')}`}
                </span>
              )
            })}
          </div>
        </div>

        {/* Ready button for all players */}
        <Button
          className="w-full"
          onClick={onReady}
        >
          <Vote className="mr-2 size-4" />
          {t('game.start_voting')}
        </Button>
      </CardContent>
    </Card>
  )
}
