'use client'

import { useState, useEffect } from 'react'
import useSupabaseBrowser from '@/lib/supabase/browser'
import { type Player, type Room, type Vote } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SelectionGroup, SelectionItem } from '@/components/ui/selection-card'
import { Check, User, Flag, Loader2, Play } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import {
  getVotesByRoomRound,
  useVotesSubscription,
  useUpsertVote,
  useEndGame,
  useNextRound,
  useEliminatePlayer,
} from '@/queries'

interface VotingScreenProps {
  room: Room
  players: Player[]
  currentPlayer: Player | null
  isHost: boolean
  onNextRound: () => void
  onEndGame: () => void
}

// Vote type: can be a player or an action
type VoteChoice = { type: 'player'; playerId: string } | { type: 'next_round' } | { type: 'end_game' }

export function VotingScreen({ room, players, currentPlayer, isHost, onNextRound, onEndGame }: VotingScreenProps) {
  const supabase = useSupabaseBrowser()
  const [myChoice, setMyChoice] = useState<VoteChoice | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [revealResult, setRevealResult] = useState(false)
  const [mostVotedPlayer, setMostVotedPlayer] = useState<{ player: Player | null; wasImpostor: boolean } | null>(null)
  const [decidedAction, setDecidedAction] = useState<'next_round' | 'end_game' | null>(null)
  const { t } = useLanguage()

  // React Query for votes
  const { data: votesData, isLoading: isLoadingVotes } = useQuery(getVotesByRoomRound(supabase, room.id, room.round))

  // Ensure votes is always an array (handle null/undefined from query)
  const votes = votesData ?? []

  // Realtime subscription
  useVotesSubscription(room.id, room.round)

  // Mutations
  const upsertVoteMutation = useUpsertVote()
  const endGameMutation = useEndGame()
  const nextRoundMutation = useNextRound()
  const eliminatePlayerMutation = useEliminatePlayer()

  const isSubmitting = upsertVoteMutation.isPending

  // Safe array operations with null checks
  const safePlayersArray = players ?? []
  const impostor = safePlayersArray.find((p) => p.is_impostor)
  // Active players (not eliminated)
  const activePlayers = safePlayersArray.filter((p) => !p.is_eliminated)
  const totalActivePlayers = activePlayers.length
  const isCurrentPlayerEliminated = currentPlayer?.is_eliminated ?? false
  const isCurrentPlayerImpostor = currentPlayer?.is_impostor ?? false

  // Players that can receive votes (only not eliminated)
  const votablePlayers = activePlayers

  // Check if I already voted
  useEffect(() => {
    if (votes && currentPlayer) {
      const myVote = votes.find((v) => v.voter_id === currentPlayer.id)
      if (myVote) {
        // Reconstruct choice from saved vote
        if (myVote.impostor_vote) {
          setMyChoice({ type: 'player', playerId: myVote.impostor_vote })
        } else if (myVote.action_vote === 'next_round') {
          setMyChoice({ type: 'next_round' })
        } else if (myVote.action_vote === 'end_game') {
          setMyChoice({ type: 'end_game' })
        }
        setHasVoted(true)
      }
    }
  }, [votes, currentPlayer?.id])

  // Process results when all ACTIVE players voted (only host processes to avoid race conditions)
  useEffect(() => {
    console.log('[Voting] Check process:', { votesCount: votes.length, totalActivePlayers, isProcessing, revealResult, isHost })
    if (votes.length === totalActivePlayers && votes.length > 0 && !isProcessing && !revealResult && isHost) {
      console.log('[Voting] All active players voted, host processing results...')
      processVotingResults()
    }
  }, [votes, totalActivePlayers, isProcessing, revealResult, isHost])

  // Count votes for each player (impostor)
  const getImpostorVoteCount = (playerId: string) => {
    return votes.filter((v) => v.impostor_vote === playerId).length
  }

  // Count action votes
  const getActionVoteCount = (action: 'next_round' | 'end_game') => {
    return votes.filter((v) => v.action_vote === action && !v.impostor_vote).length
  }

  // Active players that haven't voted yet
  const pendingVoters = activePlayers.filter(
    (p) => !votes.some((v) => v.voter_id === p.id)
  )

  const submitVote = async () => {
    if (!currentPlayer || !myChoice) return

    try {
      // Determine what to save based on choice
      let impostorVote: string | null = null
      let actionVote: 'next_round' | 'end_game' | null = null

      if (myChoice.type === 'player') {
        impostorVote = myChoice.playerId
      } else if (myChoice.type === 'next_round') {
        actionVote = 'next_round'
      } else if (myChoice.type === 'end_game') {
        actionVote = 'end_game'
      }

      await upsertVoteMutation.mutateAsync({
        roomId: room.id,
        round: room.round,
        voterId: currentPlayer.id,
        impostorVote,
        actionVote,
      })
      setHasVoted(true)
    } catch (error) {
      console.error('Erro ao votar:', error)
    }
  }

  const processVotingResults = async () => {
    setIsProcessing(true)

    // Count votes by type
    const playerVotes: Record<string, number> = {}
    let nextRoundVotes = 0
    let endGameVotes = 0

    for (const vote of votes) {
      if (vote.impostor_vote) {
        playerVotes[vote.impostor_vote] = (playerVotes[vote.impostor_vote] || 0) + 1
      } else if (vote.action_vote === 'next_round') {
        nextRoundVotes++
      } else if (vote.action_vote === 'end_game') {
        endGameVotes++
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

    // Save info about most voted for display
    if (mostVotedId) {
      const votedPlayer = players.find((p) => p.id === mostVotedId)
      setMostVotedPlayer({
        player: votedPlayer || null,
        wasImpostor: votedPlayer?.is_impostor ?? false,
      })
    } else {
      setMostVotedPlayer(null)
    }

    setRevealResult(true)

    // Determine action based on majority
    let action: 'next_round' | 'end_game' | 'eliminate'

    // Combine player votes vs next round votes vs end game votes
    if (endGameVotes > maxVotes && endGameVotes > nextRoundVotes) {
      action = 'end_game'
    } else if (maxVotes > nextRoundVotes && maxVotes > endGameVotes && mostVotedId) {
      // Majority voted for a player - eliminate or end
      action = 'eliminate'
    } else {
      // Tie or majority voted for next round - just pass the round
      action = 'next_round'
    }

    // Set decided action (don't execute automatically)
    setDecidedAction(action === 'eliminate' ? 'next_round' : action)
    setIsProcessing(false)
  }

  const startNextRound = async () => {
    try {
      // If someone was voted and wasn't the impostor, eliminate
      if (mostVotedPlayer?.player && !mostVotedPlayer.wasImpostor) {
        await eliminatePlayerMutation.mutateAsync({
          playerId: mostVotedPlayer.player.id,
          roomId: room.id,
        })
      }

      // If someone was voted AND was the impostor, impostor lost!
      if (mostVotedPlayer?.player && mostVotedPlayer.wasImpostor) {
        await endGameMutation.mutateAsync(room.id)
        onEndGame()
        return
      }

      // Check how many active players remain after possible elimination
      const remainingActive = mostVotedPlayer?.player && !mostVotedPlayer.wasImpostor
        ? activePlayers.filter(p => p.id !== mostVotedPlayer.player!.id).length
        : activePlayers.length

      // If only 2 players remain (impostor + 1), impostor wins!
      if (remainingActive <= 2) {
        await endGameMutation.mutateAsync(room.id)
        onEndGame()
        return
      }

      // Update room with new round (same word, same impostor)
      await nextRoundMutation.mutateAsync({ roomId: room.id, round: room.round + 1 })

      onNextRound()
    } catch (error) {
      console.error('Erro ao iniciar próxima rodada:', error)
    }
  }

  const endGame = async () => {
    try {
      await endGameMutation.mutateAsync(room.id)
      onEndGame()
    } catch (error) {
      console.error('Erro ao finalizar jogo:', error)
    }
  }

  const canSubmit = myChoice && !hasVoted

  // Check if a player is selected
  const isPlayerSelected = (playerId: string) => {
    return myChoice?.type === 'player' && myChoice.playerId === playerId
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('voting.title', room.round)}</CardTitle>
        <CardDescription>
          {revealResult ? (
            t('voting.desc_reveal')
          ) : (
            t('voting.desc_ask')
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* If revealing result */}
        {revealResult && (
          <div className="space-y-4">
            {/* Who was most voted */}
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
                  <Button
                    onClick={startNextRound}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Play className="mr-2 size-4" />
                    {t('voting.next_round')}
                  </Button>
                ) : (
                  <Button
                    onClick={endGame}
                    variant="destructive"
                    className="w-full"
                  >
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
              <p className="text-sm font-medium text-center">
                {t('voting.choose_option')}
              </p>

              {/* Section: Vote for player as impostor */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  {t('voting.vote_impostor_label')}
                </p>
                <SelectionGroup>
                  {votablePlayers.map((player) => (
                    <SelectionItem
                      key={player.id}
                      checked={isPlayerSelected(player.id)}
                      onChange={() => !hasVoted && setMyChoice({ type: 'player', playerId: player.id })}
                      disabled={hasVoted}
                      className="has-[:checked]:bg-primary/20 has-[:checked]:border-primary/50 dark:has-[:checked]:bg-primary/40"
                      title={
                        <span className="flex items-center gap-2">
                          <User className="size-4" />
                          {player.name}
                          {player.id === currentPlayer?.id && (
                            <span className="text-xs text-muted-foreground font-normal">({t('common.you')})</span>
                          )}
                        </span>
                      }
                      description={
                        votes.length > 0 ? (
                          <span className="flex items-center gap-1 text-xs">
                            {t('voting.vote_count', getImpostorVoteCount(player.id), getImpostorVoteCount(player.id) !== 1 ? 's' : '')}
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

              {/* Section: Alternative actions */}
              <SelectionGroup>
                <SelectionItem
                  checked={myChoice?.type === 'next_round'}
                  onChange={() => !hasVoted && setMyChoice({ type: 'next_round' })}
                  disabled={hasVoted}
                  className="has-[:checked]:bg-green-500/20 has-[:checked]:border-green-500/50 dark:has-[:checked]:bg-green-900/40 [&_input]:checked:bg-green-600 [&_input]:checked:border-green-600 [&_input]:checked:shadow-green-900 [&_input]:focus:ring-green-500"
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
                  className="has-[:checked]:bg-red-500/20 has-[:checked]:border-red-500/50 dark:has-[:checked]:bg-red-900/40 [&_input]:checked:bg-red-600 [&_input]:checked:border-red-600 [&_input]:checked:shadow-red-900 [&_input]:focus:ring-red-500"
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
              <Button
                className="w-full"
                onClick={submitVote}
                disabled={!canSubmit || isSubmitting}
              >
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
                    {t('voting.waiting_players', pendingVoters.map((p) => p.name).join(', '))}
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
