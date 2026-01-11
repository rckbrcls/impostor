'use client'

import { useState, useEffect, useCallback } from 'react'
import useSupabaseBrowser from '@/lib/supabase/browser'
import {
  type Player,
  type Room,
  type Game,
  type Round,
  type Vote,
  type GamePlayerWithPlayer,
  getVotesByRound,
  submitPlayerVote,
  submitActionVote,
  updateRoundEliminated,
  updateRoundMajorityAction,
  updateGameStatus,
  updateGameRound,
  createRound,
  endGame
} from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SelectionGroup, SelectionItem } from '@/components/ui/selection-card'
import { Check, User, Flag, Loader2, Play } from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

interface VotingScreenProps {
  room: Room
  game: Game
  currentRound: Round
  gamePlayers: GamePlayerWithPlayer[]
  currentPlayer: Player | null
  isHost: boolean
  onRoundEnd: () => void
}

// Vote type: can be a player or an action
type VoteChoice = { type: 'player'; playerId: string } | { type: 'next_round' } | { type: 'end_game' }

export function VotingScreen({
  room,
  game,
  currentRound,
  gamePlayers,
  currentPlayer,
  isHost,
  onRoundEnd
}: VotingScreenProps) {
  const supabase = useSupabaseBrowser()
  const [votes, setVotes] = useState<Vote[]>([])
  const [isLoadingVotes, setIsLoadingVotes] = useState(true)
  const [myChoice, setMyChoice] = useState<VoteChoice | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [revealResult, setRevealResult] = useState(false)
  const [mostVotedPlayer, setMostVotedPlayer] = useState<{ player: Player | null; wasImpostor: boolean } | null>(null)
  const [decidedAction, setDecidedAction] = useState<'next_round' | 'end_game' | null>(null)
  const { t } = useLanguage()

  // Find impostor
  const impostorGamePlayer = gamePlayers.find(gp => gp.is_impostor)

  // Total active players (all game players for now - elimination tracking would need more work)
  const totalActivePlayers = gamePlayers.length

  // Fetch votes
  const fetchVotes = useCallback(async () => {
    if (!currentRound?.id) return
    const { data } = await getVotesByRound(currentRound.id)
    setVotes(data || [])
    setIsLoadingVotes(false)
  }, [currentRound?.id])

  // Initial fetch
  useEffect(() => {
    fetchVotes()
  }, [fetchVotes])

  // Realtime subscription for votes
  useEffect(() => {
    if (!currentRound?.id) return

    const channel = supabase
      .channel(`votes-${currentRound.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `round_id=eq.${currentRound.id}`,
        },
        () => {
          fetchVotes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, currentRound?.id, fetchVotes])

  // Check if I already voted
  useEffect(() => {
    if (votes && currentPlayer) {
      const myVote = votes.find((v) => v.voter_id === currentPlayer.id)
      if (myVote) {
        if (myVote.is_action_vote) {
          if (myVote.action_vote === 'next_round') {
            setMyChoice({ type: 'next_round' })
          } else if (myVote.action_vote === 'end_game') {
            setMyChoice({ type: 'end_game' })
          }
        } else if (myVote.target_player_id) {
          setMyChoice({ type: 'player', playerId: myVote.target_player_id })
        }
        setHasVoted(true)
      }
    }
  }, [votes, currentPlayer?.id])

  // Process results when all players voted (all players process to show results)
  useEffect(() => {
    if (votes.length === totalActivePlayers && votes.length > 0 && !isProcessing && !revealResult) {
      processVotingResults()
    }
  }, [votes, totalActivePlayers, isProcessing, revealResult])

  // Count votes for each player
  const getPlayerVoteCount = (playerId: string) => {
    return votes.filter((v) => !v.is_action_vote && v.target_player_id === playerId).length
  }

  // Count action votes
  const getActionVoteCount = (action: 'next_round' | 'end_game') => {
    return votes.filter((v) => v.is_action_vote && v.action_vote === action).length
  }

  // Players that haven't voted yet
  const pendingVoters = gamePlayers.filter(
    (gp) => !votes.some((v) => v.voter_id === gp.player_id)
  )

  const doSubmitVote = async () => {
    if (!currentPlayer || !myChoice || !currentRound) return

    setIsSubmitting(true)
    try {
      if (myChoice.type === 'player') {
        await submitPlayerVote(currentRound.id, currentPlayer.id, myChoice.playerId)
      } else {
        await submitActionVote(currentRound.id, currentPlayer.id, myChoice.type)
      }
      setHasVoted(true)
    } catch (error) {
      console.error('Erro ao votar:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const processVotingResults = async () => {
    setIsProcessing(true)

    // Count votes by type
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

    // Find most voted player
    let mostVotedId: string | null = null
    let maxVotes = 0
    for (const [playerId, count] of Object.entries(playerVotes)) {
      if (count > maxVotes) {
        maxVotes = count
        mostVotedId = playerId
      }
    }

    // Find player info
    if (mostVotedId) {
      const votedGp = gamePlayers.find((gp) => gp.player_id === mostVotedId)
      setMostVotedPlayer({
        player: votedGp?.player || null,
        wasImpostor: votedGp?.is_impostor ?? false,
      })
    } else {
      setMostVotedPlayer(null)
    }

    setRevealResult(true)

    // Determine action based on majority
    let action: 'next_round' | 'end_game' | 'eliminate'

    if (endGameVotes > maxVotes && endGameVotes > nextRoundVotes) {
      action = 'end_game'
    } else if (maxVotes > nextRoundVotes && maxVotes > endGameVotes && mostVotedId) {
      action = 'eliminate'
    } else {
      action = 'next_round'
    }

    setDecidedAction(action === 'eliminate' ? 'next_round' : action)
    setIsProcessing(false)
  }

  const startNextRound = async () => {
    try {
      // If someone was voted and was the impostor, game ends (players win)
      if (mostVotedPlayer?.player && mostVotedPlayer.wasImpostor) {
        await updateRoundEliminated(currentRound.id, mostVotedPlayer.player.id)
        await endGame(game.id)
        onRoundEnd()
        return
      }

      // If someone was voted and wasn't the impostor
      if (mostVotedPlayer?.player && !mostVotedPlayer.wasImpostor) {
        await updateRoundEliminated(currentRound.id, mostVotedPlayer.player.id)

        // Check if only 2 players remain (impostor wins)
        const remainingCount = gamePlayers.length - 1 // -1 for the eliminated player
        if (remainingCount <= 2) {
          await endGame(game.id)
          onRoundEnd()
          return
        }
      } else {
        // No player eliminated, just action vote
        await updateRoundMajorityAction(currentRound.id, 'next_round')
      }

      // Create next round
      const nextRoundNumber = game.current_round + 1
      await createRound(game.id, nextRoundNumber)

      // Update game with new round number and back to playing status
      await updateGameRound(game.id, nextRoundNumber)
      await updateGameStatus(game.id, 'voting')

      onRoundEnd()
    } catch (error) {
      console.error('Erro ao iniciar próxima rodada:', error)
    }
  }

  const doEndGame = async () => {
    try {
      await updateRoundMajorityAction(currentRound.id, 'end_game')
      await endGame(game.id)
      onRoundEnd()
    } catch (error) {
      console.error('Erro ao finalizar jogo:', error)
    }
  }

  const canSubmit = myChoice && !hasVoted

  const isPlayerSelected = (playerId: string) => {
    return myChoice?.type === 'player' && myChoice.playerId === playerId
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('voting.title', game.current_round)}</CardTitle>
        <CardDescription>
          {revealResult ? t('voting.desc_reveal') : t('voting.desc_ask')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* If revealing result */}
        {revealResult && (
          <div className="space-y-4">
            {mostVotedPlayer?.player ? (
              <div className={`p-6 text-center border-2 border-black shadow-[4px_4px_0_0] dark:border-white dark:shadow-white ${mostVotedPlayer.wasImpostor
                ? 'bg-green-500/20'
                : 'bg-orange-500/20'
                }`}>
                <p className="text-sm text-muted-foreground mb-2">{t('voting.most_voted_label')}</p>
                <p className="text-3xl font-bold mb-2">
                  {mostVotedPlayer.player.name}
                </p>
                {mostVotedPlayer.wasImpostor ? (
                  <p className="text-xl text-green-400 font-semibold">{t('voting.result_impostor')}</p>
                ) : (
                  <p className="text-xl text-orange-400 font-semibold">{t('voting.result_innocent')}</p>
                )}
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
                  <Button onClick={startNextRound} className="w-full bg-green-600 hover:bg-green-700">
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
        )}

        {/* Voting */}
        {!revealResult && (
          <>
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">{t('voting.choose_option')}</p>

              {/* Vote for player */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  {t('voting.vote_impostor_label')}
                </p>
                <SelectionGroup>
                  {gamePlayers.map((gp) => (
                    <SelectionItem
                      key={gp.id}
                      checked={isPlayerSelected(gp.player_id)}
                      onChange={() => !hasVoted && setMyChoice({ type: 'player', playerId: gp.player_id })}
                      disabled={hasVoted}
                      className="has-[:checked]:bg-primary/20 has-[:checked]:border-primary/50 dark:has-[:checked]:bg-primary/40"
                      title={
                        <span className="flex items-center gap-2">
                          <User className="size-4" />
                          {gp.player?.name ?? 'Unknown'}
                          {gp.player_id === currentPlayer?.id && (
                            <span className="text-xs text-muted-foreground font-normal">({t('common.you')})</span>
                          )}
                        </span>
                      }
                      description={
                        votes.length > 0 ? (
                          <span className="flex items-center gap-1 text-xs">
                            {t('voting.vote_count', getPlayerVoteCount(gp.player_id), getPlayerVoteCount(gp.player_id) !== 1 ? 's' : '')}
                          </span>
                        ) : undefined
                      }
                    />
                  ))}
                </SelectionGroup>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-black dark:border-white" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-black px-2 text-muted-foreground border-2 border-black dark:border-white shadow-[2px_2px_0_0]">{t('common.or')}</span>
                </div>
              </div>

              {/* Action votes */}
              <SelectionGroup>
                <SelectionItem
                  checked={myChoice?.type === 'next_round'}
                  onChange={() => !hasVoted && setMyChoice({ type: 'next_round' })}
                  disabled={hasVoted}
                  className="has-[:checked]:bg-green-500/20 has-[:checked]:border-green-500/50 dark:has-[:checked]:bg-green-900/40"
                  title={
                    <span className="flex items-center gap-2">
                      <Play className="size-4" />
                      {t('voting.option_next_round')}
                    </span>
                  }
                  description={
                    votes.length > 0 ? (
                      <span className="text-xs">
                        {t('voting.vote_count', getActionVoteCount('next_round'), getActionVoteCount('next_round') !== 1 ? 's' : '')}
                      </span>
                    ) : undefined
                  }
                />
                <SelectionItem
                  checked={myChoice?.type === 'end_game'}
                  onChange={() => !hasVoted && setMyChoice({ type: 'end_game' })}
                  disabled={hasVoted}
                  className="has-[:checked]:bg-red-500/20 has-[:checked]:border-red-500/50 dark:has-[:checked]:bg-red-900/40"
                  title={
                    <span className="flex items-center gap-2">
                      <Flag className="size-4" />
                      {t('voting.option_end_game')}
                    </span>
                  }
                  description={
                    votes.length > 0 ? (
                      <span className="text-xs">
                        {t('voting.vote_count', getActionVoteCount('end_game'), getActionVoteCount('end_game') !== 1 ? 's' : '')}
                      </span>
                    ) : undefined
                  }
                />
              </SelectionGroup>
            </div>

            {/* Confirm button */}
            {!hasVoted && (
              <Button className="w-full" onClick={doSubmitVote} disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t('voting.button_sending')}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 size-4" />
                    {t('voting.button_confirm')}
                  </>
                )}
              </Button>
            )}

            {hasVoted && (
              <div className="bg-green-500/10 border-2 border-black shadow-[2px_2px_0_0] dark:border-white dark:shadow-white p-3 text-center">
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center gap-2 font-semibold">
                  <Check className="size-4" />
                  {t('voting.confirmed')}
                </p>
              </div>
            )}

            {/* Voting status */}
            <div className="text-center text-sm text-muted-foreground">
              {pendingVoters.length > 0 ? (
                <>
                  <p className="mb-1">
                    {t('voting.waiting_players', pendingVoters.map((gp) => gp.player?.name).join(', '))}
                  </p>
                  <p>
                    {t('voting.progress', votes.length, totalActivePlayers)}
                  </p>
                </>
              ) : (
                <p>{t('voting.all_voted')}</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
