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
  getRoundsByGame,
  incrementPlayerScore
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
  onStartNextRound: () => Promise<any>
  onEndGame: (winner: 'impostor' | 'players') => Promise<any>
}

export function VoteConclusionScreen({
  room,
  game,
  currentRound,
  gamePlayers,
  currentPlayer,
  isHost,
  onStartNextRound,
  onEndGame
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
      // Get fresh data
      const { data: allVotes } = await getVotesByRound(currentRound.id)
      const { data: allRounds } = await getRoundsByGame(game.id)

      // Find 'this' round in the fresh list
      const thisRoundFresh = allRounds.find(r => r.id === currentRound.id)
      const eliminatedId = thisRoundFresh?.eliminated_player_id

      // Find impostor
      const impostorGp = gamePlayers.find(gp => gp.is_impostor)
      const impostorId = impostorGp?.player_id

      let impostorCaught = false
      if (eliminatedId) {
        const eliminatedGp = gamePlayers.find(gp => gp.player_id === eliminatedId)
        if (eliminatedGp?.is_impostor) {
          impostorCaught = true
        }
      }

      // ===== SCORING LOGIC =====
      // Award points for correct votes (voting for the impostor)
      if (allVotes && impostorId) {
        for (const vote of allVotes) {
          if (!vote.is_action_vote && vote.target_player_id === impostorId) {
            // +10 points for correct vote on impostor
            await incrementPlayerScore(vote.voter_id, 10)
            console.log(`[Scoring] +10 to ${vote.voter_id} for correct vote`)
          }
        }
      }

      if (impostorCaught) {
        // Players win! Give bonus points to non-impostors
        for (const gp of gamePlayers) {
          if (!gp.is_impostor) {
            // +20 bonus for winning
            await incrementPlayerScore(gp.player_id, 20)
            console.log(`[Scoring] +20 to ${gp.player_id} for winning (catching impostor)`)
          }
        }
        await onEndGame('players')
      } else {
        // Impostor survived this round! Give them points
        if (impostorId) {
          // +5 points for surviving a round
          await incrementPlayerScore(impostorId, 5)
          console.log(`[Scoring] +5 to ${impostorId} for surviving a round as impostor`)
        }

        // Check 1v1 Condition (Impostor Wins)
        let totalEliminated = 0
        allRounds.forEach(r => {
          if (r.eliminated_player_id) {
            totalEliminated++
          }
        })

        const remainingCount = gamePlayers.length - totalEliminated
        if (remainingCount <= 2) {
          // Impostor wins! Give bonus points
          if (impostorId) {
            await incrementPlayerScore(impostorId, 20)
            console.log(`[Scoring] +20 to ${impostorId} for winning as impostor (last survivor)`)
          }
          await onEndGame('impostor')
        } else if (thisRoundFresh?.majority_action === 'end_game') {
          // Majority voted to end game - impostor wins by default
          if (impostorId) {
            await incrementPlayerScore(impostorId, 20)
            console.log(`[Scoring] +20 to ${impostorId} for winning (game ended by vote)`)
          }
          await onEndGame('impostor')
        } else {
          // CONTINUE TO NEXT ROUND
          await onStartNextRound()
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
    <Card className="w-full max-w-md mx-auto rounded-none">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('vote_conclusion.title')}</CardTitle>
        <CardDescription>{t('vote_conclusion.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">

        {myVoteResult ? (
          <div className={`p-6 border-2 shadow-[4px_4px_0_0] rounded-none ${myVoteResult.isCorrect
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
          <div className="p-6 border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 rounded-none shadow-[4px_4px_0_0] shadow-black dark:shadow-white">
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
              className="w-full text-lg h-12 rounded-none"
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
