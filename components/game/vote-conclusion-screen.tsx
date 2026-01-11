'use client'

import { useEffect, useState, useCallback } from 'react'
import useSupabaseBrowser from '@/lib/supabase/browser'
import {
  type Game,
  type Player,
  type Room,
  type Round,
  type Vote,
  type GamePlayerWithPlayer,
  getVotesByRound,
  updateGameStatus,
  createRound,
  updateGameRound,
  endGame,
  getRoundsByGame
} from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Check, X, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

interface VoteConclusionScreenProps {
  room: Room
  game: Game
  currentRound: Round
  gamePlayers: GamePlayerWithPlayer[]
  currentPlayer: Player | null
  isHost: boolean
}

export function VoteConclusionScreen({
  room,
  game,
  currentRound,
  gamePlayers,
  currentPlayer,
  isHost
}: VoteConclusionScreenProps) {
  const supabase = useSupabaseBrowser()
  const { t } = useLanguage()

  const [votes, setVotes] = useState<Vote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [myVoteResult, setMyVoteResult] = useState<{
    votedPlayer: Player | null;
    wasImpostor: boolean;
    isCorrect: boolean;
  } | null>(null)

  // Fetch votes to determine what the user voted for
  const fetchVotes = useCallback(async () => {
    if (!currentRound?.id) return
    setIsLoading(true)
    const { data } = await getVotesByRound(currentRound.id)
    setVotes(data || [])
    setIsLoading(false)
  }, [currentRound?.id])

  useEffect(() => {
    fetchVotes()
  }, [fetchVotes])

  // Process my vote
  useEffect(() => {
    if (!isLoading && votes.length > 0 && currentPlayer) {
      const myVote = votes.find(v => v.voter_id === currentPlayer.id)

      if (myVote && myVote.target_player_id) {
        // Player voted for someone
        const targetId = myVote.target_player_id
        const targetGp = gamePlayers.find(gp => gp.player_id === targetId)

        if (targetGp) {
          setMyVoteResult({
            votedPlayer: targetGp.player || null,
            wasImpostor: targetGp.is_impostor,
            isCorrect: targetGp.is_impostor // Correct if voted for impostor
          })
        }
      } else {
        // Did not vote for a player (skipped or action vote)
        setMyVoteResult(null)
      }
    }
  }, [votes, currentPlayer, gamePlayers, isLoading])

  const handleContinue = async () => {
    if (!isHost) return
    setIsProcessing(true)
    try {
      // Logic moved effectively from VotingScreen to here
      // We check game over conditions based on the CURRENT state (which should have elimination/action processed)

      // 1. Check if Impostor was caught
      // To do this we need to know who was eliminated in THIS round.
      // But we just came from VotingScreen which supposedly set `eliminated_player_id` on the current round.
      // Ideally we would re-fetch currentRound here or assume its up to date if realtime works.
      // Let's rely on checking `rounds` table or re-fetching.
      // Or we can check if the elimination was the impostor.

      const { data: roundData } = await getVotesByRound(currentRound.id) // Just to reuse fetch or similar? No.
      // We need getRoundsByGame to check total eliminations
      const { data: allRounds } = await getRoundsByGame(game.id)

      // Find 'this' round in the fresh list
      const thisRoundFresh = allRounds.find(r => r.id === currentRound.id)
      const eliminatedId = thisRoundFresh?.eliminated_player_id

      let impostorCaught = false
      if (eliminatedId) {
        const eliminatedGp = gamePlayers.find(gp => gp.player_id === eliminatedId)
        if (eliminatedGp?.is_impostor) {
          impostorCaught = true
        }
      }

      if (impostorCaught) {
        await endGame(game.id)
        // Status becomes game_over, UI handles it
      } else {
        // Check 1v1 Condition (Impostor Wins)
        // Count total eliminated
        let totalEliminated = 0
        allRounds.forEach(r => {
          if (r.eliminated_player_id) {
            totalEliminated++
          }
        })

        const remainingCount = gamePlayers.length - totalEliminated
        if (remainingCount <= 2) {
          // Impostor wins
          await endGame(game.id)
        } else if (thisRoundFresh?.majority_action === 'end_game') {
          // Majority voted to end game
          await endGame(game.id)
        } else {
          // CONTINUE TO NEXT ROUND
          const nextRoundNumber = game.current_round + 1
          await createRound(game.id, nextRoundNumber)
          await updateGameRound(game.id, nextRoundNumber)
          await updateGameStatus(game.id, 'voting')
        }
      }

    } catch (error) {
      console.error('Error updating game status:', error)
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('vote_conclusion.title')}</CardTitle>
        <CardDescription>{t('vote_conclusion.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">

        {myVoteResult ? (
          <div className={`p-6 border-2 shadow-[4px_4px_0_0] ${myVoteResult.isCorrect
            ? 'bg-green-500/10 border-green-600 shadow-green-600 dark:border-green-400 dark:shadow-green-400'
            : 'bg-red-500/10 border-red-600 shadow-red-600 dark:border-red-400 dark:shadow-red-400'
            }`}>
            <p className="text-sm text-muted-foreground mb-4">
              {t('vote_conclusion.you_voted_for')}
            </p>

            <div className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
              {myVoteResult.votedPlayer?.name}
            </div>

            <div className="flex items-center justify-center gap-2 text-lg font-bold">
              {myVoteResult.isCorrect ? (
                <>
                  <Check className="size-6 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400">{t('vote_conclusion.impostor_found')}</span>
                </>
              ) : (
                <>
                  <X className="size-6 text-red-600 dark:text-red-400" />
                  <span className="text-red-600 dark:text-red-400">{t('vote_conclusion.not_impostor')}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
            <p className="text-muted-foreground">
              {t('vote_conclusion.skipped_or_action')}
            </p>
          </div>
        )}

        <div className="pt-4">
          {isHost ? (
            <Button
              onClick={handleContinue}
              disabled={isProcessing}
              className="w-full text-lg h-12"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 size-5 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 size-5" />
              )}
              {t('vote_conclusion.continue_to_results')}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{t('vote_conclusion.waiting_for_host')}</span>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
