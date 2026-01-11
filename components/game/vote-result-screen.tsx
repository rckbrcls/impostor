'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import useSupabaseBrowser from '@/lib/supabase/browser'
import {
  type Player,
  type Room,
  type Game,
  type Round,
  type Vote,
  type GamePlayerWithPlayer,
  updateRoundMajorityAction,
  getRoundsByGame
} from '@/lib/supabase'
import { getVotesByRound } from '@/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Play, Flag } from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

interface VoteResultScreenProps {
  room: Room
  game: Game
  currentRound: Round
  gamePlayers: GamePlayerWithPlayer[]
  currentPlayer: Player | null
  isHost: boolean
  onProceedToConclusion: (eliminatedPlayerId?: string) => Promise<any>
}

export function VoteResultScreen({
  room,
  game,
  currentRound,
  gamePlayers,
  currentPlayer,
  isHost,
  onProceedToConclusion
}: VoteResultScreenProps) {
  const supabase = useSupabaseBrowser()
  const [votes, setVotes] = useState<Vote[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Local state for calculation results
  const [mostVotedPlayer, setMostVotedPlayer] = useState<{ player: Player | null; wasImpostor: boolean } | null>(null)
  const [decidedAction, setDecidedAction] = useState<'next_round' | 'end_game' | null>(null)

  const { t } = useLanguage()

  // Find most recent round if needed or use currentRound
  const currentRoundIdRef = useRef(currentRound?.id)

  useEffect(() => {
    currentRoundIdRef.current = currentRound?.id
  }, [currentRound?.id])

  // Fetch votes
  const fetchVotes = useCallback(async () => {
    if (!currentRound?.id) return
    const { data } = await getVotesByRound(supabase, currentRound.id)
    if (currentRoundIdRef.current === currentRound.id) {
      setVotes(data || [])
    }
  }, [currentRound?.id, supabase])

  // Initial fetch
  useEffect(() => {
    fetchVotes()
  }, [fetchVotes])

  // Realtime subscription for votes (in case of late updates or if needed, though usually results are static here)
  useEffect(() => {
    if (!currentRound?.id) return

    const channel = supabase
      .channel(`votes-result-${currentRound.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes', filter: `round_id=eq.${currentRound.id}` },
        () => fetchVotes()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, currentRound?.id, fetchVotes])

  // Calculate Results
  useEffect(() => {
    if (votes.length > 0) {
      calculateResults()
    }
  }, [votes])

  const calculateResults = () => {
    const { action, mostVoted } = determineOutcome()
    setMostVotedPlayer(mostVoted)
    setDecidedAction(action === 'eliminate' ? 'next_round' : action)
  }

  const determineOutcome = () => {
    const playerVotes: Record<string, number> = {}
    let nextRoundVotes = 0
    let endGameVotes = 0

    for (const vote of votes) {
      if (vote.is_action_vote) {
        if (vote.action_vote === 'next_round') nextRoundVotes++
        else if (vote.action_vote === 'end_game') endGameVotes++
      } else if (vote.target_player_id) {
        playerVotes[vote.target_player_id] = (playerVotes[vote.target_player_id] || 0) + 1
      }
    }

    let mostVotedId: string | null = null
    let maxVotes = 0
    for (const [playerId, count] of Object.entries(playerVotes)) {
      if (count > maxVotes) {
        maxVotes = count
        mostVotedId = playerId
      }
    }

    let mostVoted: { player: Player | null; wasImpostor: boolean } | null = null
    if (mostVotedId) {
      const votedGp = gamePlayers.find((gp) => gp.player_id === mostVotedId)
      mostVoted = {
        player: votedGp?.player || null,
        wasImpostor: votedGp?.is_impostor ?? false,
      }
    }

    let action: 'next_round' | 'end_game' | 'eliminate'

    if (endGameVotes > maxVotes && endGameVotes > nextRoundVotes) {
      action = 'end_game'
    } else if (maxVotes > nextRoundVotes && maxVotes > endGameVotes && mostVotedId) {
      action = 'eliminate'
    } else {
      action = 'next_round'
    }

    return { action, mostVoted }
  }

  const handleProceedToConclusion = async () => {
    try {
      setIsProcessing(true)
      let eliminatedId: string | undefined = undefined;

      if (mostVotedPlayer?.player) {
        eliminatedId = mostVotedPlayer.player.id;
      } else if (decidedAction === 'end_game') {
        await updateRoundMajorityAction(currentRound.id, 'end_game')
      } else {
        await updateRoundMajorityAction(currentRound.id, 'next_round')
      }

      await onProceedToConclusion(eliminatedId)
    } catch (error) {
      console.error('Erro ao avançar para conclusão:', error)
      setIsProcessing(false) // Only reset on error
    }
  }

  const doEndGame = async () => {
    try {
      setIsProcessing(true)
      await updateRoundMajorityAction(currentRound.id, 'end_game')
      await onProceedToConclusion()
    } catch (error) {
      console.error('Erro ao finalizar jogo:', error)
      setIsProcessing(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('voting.title', game.current_round)}</CardTitle>
        <CardDescription>
          {t('voting.desc_reveal')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {mostVotedPlayer?.player ? (
            <div className="p-6 text-center border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white bg-neutral-500/20">
              <p className="text-sm text-muted-foreground mb-2">{t('voting.most_voted_label')}</p>
              <p className="text-3xl font-bold mb-2">
                {mostVotedPlayer.player.name}
              </p>
              <p className="text-xl text-neutral-600 dark:text-neutral-400 font-semibold">{t('voting.result_selected')}</p>
            </div>
          ) : (
            <div className="p-6 text-center border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white">
              <p className="text-muted-foreground">{t('voting.no_votes')}</p>
            </div>
          )}

          {isProcessing ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{t('voting.processing')}</span>
            </div>
          ) : decidedAction && isHost ? (
            <div className="flex flex-col gap-3">
              {decidedAction === 'next_round' ? (
                <Button onClick={handleProceedToConclusion} className="w-full bg-green-600 hover:bg-green-700">
                  <Play className="mr-2 size-4" />
                  {t('voting.next_round')}
                </Button>
              ) : (
                <Button onClick={doEndGame} variant="destructive" className="w-full">
                  <Flag className="mr-2 size-4" />
                  {t('voting.end_game')}
                </Button>
              )}
            </div>
          ) : decidedAction && !isHost ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>{t('voting.waiting_host_continue')}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
