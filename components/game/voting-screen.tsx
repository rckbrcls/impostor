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
  submitPlayerVote,
  submitActionVote,
  getRoundsByGame
} from '@/lib/supabase'
import { getVotesByRound } from '@/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SelectionGroup, SelectionItem } from '@/components/ui/selection-card'
import { Check, User, Flag, Loader2, Play, UserX } from 'lucide-react'
import { useLanguage } from '@/stores/language-store'

interface VotingScreenProps {
  room: Room
  game: Game
  currentRound: Round
  gamePlayers: GamePlayerWithPlayer[]
  currentPlayer: Player | null
  isHost: boolean
  onProcessVoteResult: () => Promise<any>
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
  onProcessVoteResult,
}: VotingScreenProps) {
  const supabase = useSupabaseBrowser()
  const [votes, setVotes] = useState<Vote[]>([])
  const [isLoadingVotes, setIsLoadingVotes] = useState(true)
  const [myChoice, setMyChoice] = useState<VoteChoice | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Track eliminated players
  const [eliminatedPlayerIds, setEliminatedPlayerIds] = useState<Set<string>>(new Set())

  const { t } = useLanguage()

  // Fetch eliminated players
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
  }, [game.id, currentRound.id])

  // Total active players (all game players minus eliminated ones)
  const totalActivePlayers = gamePlayers.length - eliminatedPlayerIds.size

  // Am I eliminated?
  const amIEliminated = currentPlayer ? eliminatedPlayerIds.has(currentPlayer.id) : false

  // Track the current round ID to prevent stale updates
  const currentRoundIdRef = useRef(currentRound?.id)

  useEffect(() => {
    currentRoundIdRef.current = currentRound?.id
  }, [currentRound?.id])

  // Fetch votes
  const fetchVotes = useCallback(async () => {
    if (!currentRound?.id) return
    const roundIdToFetch = currentRound.id

    setIsLoadingVotes(true)
    const { data } = await getVotesByRound(supabase, roundIdToFetch)

    // Only update state if we are still on the same round
    if (currentRoundIdRef.current === roundIdToFetch) {
      setVotes(data || [])
      setIsLoadingVotes(false)
    }
  }, [currentRound?.id, supabase])

  // Initial fetch and reset
  useEffect(() => {
    if (currentRound?.id) {
      // Clear votes immediately when round changes to avoid seeing previous round votes
      setVotes([])
      setMyChoice(null)
      setHasVoted(false)
      fetchVotes()
    }
  }, [currentRound?.id, fetchVotes])

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

  // Process results when all players voted (Host triggers update to vote_result)
  useEffect(() => {
    if (
      isHost &&
      votes.length >= totalActivePlayers && // Changed to >= to be safe
      votes.length > 0 &&
      (game.status === 'voting' || game.status === 'reveal') &&
      !isProcessing &&
      currentRound.round_number === game.current_round &&
      votes.every(v => v.round_id === currentRound.id)
    ) {
      processVotingResults()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votes, totalActivePlayers, isProcessing, game.status, isHost, currentRound.round_number, game.current_round, currentRound.id])

  // Count votes for each player
  const getPlayerVoteCount = (playerId: string) => {
    return votes.filter((v) => !v.is_action_vote && v.target_player_id === playerId).length
  }

  // Count action votes
  const getActionVoteCount = (action: 'next_round' | 'end_game') => {
    return votes.filter((v) => v.is_action_vote && v.action_vote === action).length
  }

  // Players that haven't voted yet (and are active)
  const pendingVoters = gamePlayers.filter(
    (gp) => !eliminatedPlayerIds.has(gp.player_id) && !votes.some((v) => v.voter_id === gp.player_id)
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
    // We update status to vote_result so everyone sees group results first
    await onProcessVoteResult()
    setIsProcessing(false)
  }

  const canSubmit = myChoice && !hasVoted

  const isPlayerSelected = (playerId: string) => {
    return myChoice?.type === 'player' && myChoice.playerId === playerId
  }

  // Active players for the list (exclude eliminated)
  const activeGamePlayers = gamePlayers.filter(gp => !eliminatedPlayerIds.has(gp.player_id))

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('voting.title', game.current_round)}</CardTitle>
        <CardDescription>
          {t('voting.desc_ask')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <>
          {amIEliminated ? (
            <div className="p-8 text-center bg-red-500/10 border-2 border-red-500 dark:border-red-500 shadow-[4px_4px_0_0] shadow-red-500">
              <UserX className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">{t('game.eliminated')}</h3>
              <p className="text-sm font-medium">
                You can watch the voting process but cannot participate.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">{t('voting.choose_option')}</p>

              {/* Vote for player */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  {t('voting.vote_impostor_label')}
                </p>
                <SelectionGroup>
                  {activeGamePlayers.map((gp) => (
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
          )}

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

      </CardContent>
    </Card>
  )
}
