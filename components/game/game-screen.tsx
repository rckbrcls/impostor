'use client'

import { useState, useEffect } from 'react'
import useSupabaseBrowser from '@/lib/supabase/browser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Vote, VenetianMask, UserX } from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

interface GameScreenProps {
  room: Room
  game: Game
  currentRound: Round
  gamePlayers: GamePlayerWithPlayer[]
  currentPlayer: Player | null
  currentGamePlayer: GamePlayerWithPlayer | null
  isHost: boolean
  onReady: () => void
  onAdvanceToVoting?: () => void
}

export function GameScreen({
  room,
  game,
  currentRound,
  gamePlayers,
  currentPlayer,
  currentGamePlayer,
  isHost,
  onReady,
  onAdvanceToVoting
}: GameScreenProps) {
  const isImpostor = currentGamePlayer?.is_impostor ?? true
  const { t } = useLanguage()

  const [eliminatedPlayerIds, setEliminatedPlayerIds] = useState<Set<string>>(new Set())
  const [isReady, setIsReady] = useState(false)

  // Initialization
  useEffect(() => {
    if (currentGamePlayer?.role_acknowledged) {
      setIsReady(true)
    }
  }, [currentGamePlayer?.role_acknowledged])

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

  // Check if all active players are ready (Host only)
  useEffect(() => {
    if (!isHost || !gamePlayers.length) return

    // Filter out eliminated players if any (though usually reveal is round 1 so none eliminated)
    // Actually reveal happens ONLY at start, so no one eliminated yet.
    const activePlayers = gamePlayers.filter(gp => !eliminatedPlayerIds.has(gp.player_id))
    const allReady = activePlayers.every(gp => gp.role_acknowledged)

    if (allReady) {
      // Small delay for UX so host sees the "Waiting" state change momentarily
      const timer = setTimeout(() => {
        onAdvanceToVoting && onAdvanceToVoting()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isHost, gamePlayers, eliminatedPlayerIds, onAdvanceToVoting])


  if (!currentGamePlayer) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-2">
          <Skeleton className="h-6 w-1/3 mx-auto" />
          <Skeleton className="h-4 w-1/4 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  const handleReady = () => {
    setIsReady(true)
    onReady()
  }

  if (isReady) {
    // Show waiting screen
    const readyCount = gamePlayers.filter(gp => gp.role_acknowledged).length
    const totalCount = gamePlayers.length

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {t('game.waiting_title') || 'Waiting for Players'}
          </CardTitle>
          <CardDescription>
            {t('game.waiting_desc') || 'The voting will start once everyone is ready.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
          <p className="text-lg font-medium">
            {readyCount} / {totalCount} {t('game.players_ready') || 'players ready'}
          </p>
          {isHost && readyCount < totalCount && (
            <p className="text-sm text-muted-foreground">
              {t('game.host_waiting_hint') || 'As host, the game will advance automatically when everyone is ready.'}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

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
              <div className="flex justify-center mb-4">
                <VenetianMask className="size-16" />
              </div>
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
                  className={`px-3 py-1 text-sm border-2 border-black dark:border-white font-semibold flex items-center gap-1 ${isEliminated
                    ? 'bg-red-500/20 text-red-500 line-through opacity-60'
                    : gp.player_id === currentPlayer?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white dark:bg-zinc-900'
                    }`}
                >
                  {gp.player?.name ?? 'Unknown'}
                  {isEliminated && (
                    <>
                      <UserX className="size-3" />
                      {t('game.eliminated')}
                    </>
                  )}
                </span>
              )
            })}
          </div>
        </div>

        {/* Ready button - Now for ALL players to advance locally to waiting state */}
        <Button
          className="w-full"
          onClick={handleReady}
        >
          <Vote className="mr-2 size-4" />
          {t('game.ready_to_vote') || 'Pronto para Votar'}
        </Button>
      </CardContent>
    </Card>
  )
}
