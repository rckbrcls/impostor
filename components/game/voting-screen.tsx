'use client'

import { useState, useEffect } from 'react'
import { supabase, type Player, type Room, type Vote } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SelectionGroup, SelectionItem } from '@/components/ui/selection-card'
import { Check, User, Flag, Loader2, Play } from 'lucide-react'
import { useLanguage } from '@/components/language-context'

interface VotingScreenProps {
  room: Room
  players: Player[]
  currentPlayer: Player | null
  isHost: boolean
  onNextRound: () => void
  onEndGame: () => void
}

// Tipo de voto: pode ser um jogador ou uma ação
type VoteChoice = { type: 'player'; playerId: string } | { type: 'next_round' } | { type: 'end_game' }

export function VotingScreen({ room, players, currentPlayer, isHost, onNextRound, onEndGame }: VotingScreenProps) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [myChoice, setMyChoice] = useState<VoteChoice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [revealResult, setRevealResult] = useState(false)
  const [mostVotedPlayer, setMostVotedPlayer] = useState<{ player: Player | null; wasImpostor: boolean } | null>(null)
  const [decidedAction, setDecidedAction] = useState<'next_round' | 'end_game' | null>(null)
  const { t } = useLanguage()

  const impostor = players.find((p) => p.is_impostor)
  // Jogadores ativos (não eliminados)
  const activePlayers = players.filter((p) => !p.is_eliminated)
  const totalActivePlayers = activePlayers.length
  const isCurrentPlayerEliminated = currentPlayer?.is_eliminated ?? false
  const isCurrentPlayerImpostor = currentPlayer?.is_impostor ?? false

  // Jogadores que podem receber votos (apenas não eliminados)
  const votablePlayers = activePlayers

  // Carregar votos existentes
  useEffect(() => {
    const loadVotes = async () => {
      const { data } = await supabase
        .from('votes')
        .select('*')
        .eq('room_id', room.id)
        .eq('round', room.round)

      if (data) {
        setVotes(data)
        // Verificar se já votei
        const myVote = data.find((v) => v.voter_id === currentPlayer?.id)
        if (myVote) {
          // Reconstruir a escolha a partir do voto salvo
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
    }

    loadVotes()
  }, [room.id, room.round, currentPlayer?.id])

  // Realtime subscription para votos
  useEffect(() => {
    // Carregar votos iniciais
    const loadVotes = async () => {
      const { data } = await supabase
        .from('votes')
        .select('*')
        .eq('room_id', room.id)
        .eq('round', room.round)
      console.log('[Voting] Loaded votes:', data?.length)
      setVotes(data || [])
    }
    loadVotes()

    const channel = supabase
      .channel(`votes-${room.id}-${room.round}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          console.log('[Voting] Realtime event:', payload.eventType)
          // Recarregar votos
          const { data } = await supabase
            .from('votes')
            .select('*')
            .eq('room_id', room.id)
            .eq('round', room.round)

          console.log('[Voting] Votes after realtime:', data?.length)
          setVotes(data || [])
        }
      )
      .subscribe((status) => {
        console.log('[Voting] Channel status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, room.round])

  // Processar resultados quando todos jogadores ATIVOS votarem (apenas o host processa para evitar race conditions)
  useEffect(() => {
    console.log('[Voting] Check process:', { votesCount: votes.length, totalActivePlayers, isProcessing, revealResult, isHost })
    if (votes.length === totalActivePlayers && votes.length > 0 && !isProcessing && !revealResult && isHost) {
      console.log('[Voting] All active players voted, host processing results...')
      processVotingResults()
    }
  }, [votes, totalActivePlayers, isProcessing, revealResult, isHost])

  // Contar votos para cada jogador (impostor)
  const getImpostorVoteCount = (playerId: string) => {
    return votes.filter((v) => v.impostor_vote === playerId).length
  }

  // Contar votos de ação
  const getActionVoteCount = (action: 'next_round' | 'end_game') => {
    return votes.filter((v) => v.action_vote === action && !v.impostor_vote).length
  }

  // Jogadores ativos que ainda não votaram
  const pendingVoters = activePlayers.filter(
    (p) => !votes.some((v) => v.voter_id === p.id)
  )

  const submitVote = async () => {
    if (!currentPlayer || !myChoice) return

    setIsSubmitting(true)

    try {
      // Determinar o que salvar baseado na escolha
      let impostorVote: string | null = null
      let actionVote: 'next_round' | 'end_game' | null = null

      if (myChoice.type === 'player') {
        impostorVote = myChoice.playerId
      } else if (myChoice.type === 'next_round') {
        actionVote = 'next_round'
      } else if (myChoice.type === 'end_game') {
        actionVote = 'end_game'
      }

      await supabase.from('votes').upsert(
        {
          room_id: room.id,
          round: room.round,
          voter_id: currentPlayer.id,
          impostor_vote: impostorVote,
          action_vote: actionVote,
        },
        {
          onConflict: 'room_id,round,voter_id',
        }
      )
      setHasVoted(true)
    } catch (error) {
      console.error('Erro ao votar:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const processVotingResults = async () => {
    setIsProcessing(true)

    // Contar votos por tipo
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

    // Encontrar o jogador mais votado
    let mostVotedId: string | null = null
    let maxVotes = 0
    for (const [playerId, count] of Object.entries(playerVotes)) {
      if (count > maxVotes) {
        maxVotes = count
        mostVotedId = playerId
      }
    }

    // Guardar informação do mais votado para exibir
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

    // Determinar ação baseada na maioria
    let action: 'next_round' | 'end_game' | 'eliminate'

    // Combina votos em jogadores vs votos em próxima rodada vs votos em finalizar
    if (endGameVotes > maxVotes && endGameVotes > nextRoundVotes) {
      action = 'end_game'
    } else if (maxVotes > nextRoundVotes && maxVotes > endGameVotes && mostVotedId) {
      // Maioria votou em um jogador - eliminar ou terminar
      action = 'eliminate'
    } else {
      // Empate ou maioria votou em próxima rodada - apenas passar a rodada
      action = 'next_round'
    }

    // Definir ação decidida (não executar automaticamente)
    setDecidedAction(action === 'eliminate' ? 'next_round' : action)
    setIsProcessing(false)
  }

  const startNextRound = async () => {
    try {
      // Se alguém foi votado e não era o impostor, eliminar
      if (mostVotedPlayer?.player && !mostVotedPlayer.wasImpostor) {
        await supabase
          .from('players')
          .update({ is_eliminated: true })
          .eq('id', mostVotedPlayer.player.id)
      }

      // Se alguém foi votado E era o impostor, o impostor perdeu!
      if (mostVotedPlayer?.player && mostVotedPlayer.wasImpostor) {
        await supabase
          .from('rooms')
          .update({ status: 'ended' })
          .eq('id', room.id)
        onEndGame()
        return
      }

      // Verificar quantos jogadores ativos restam após possível eliminação
      const remainingActive = mostVotedPlayer?.player && !mostVotedPlayer.wasImpostor
        ? activePlayers.filter(p => p.id !== mostVotedPlayer.player!.id).length
        : activePlayers.length

      // Se restar apenas 2 jogadores (impostor + 1), o impostor vence!
      if (remainingActive <= 2) {
        await supabase
          .from('rooms')
          .update({ status: 'ended' })
          .eq('id', room.id)
        onEndGame()
        return
      }

      // Atualizar sala com nova rodada (mesma palavra, mesmo impostor)
      await supabase
        .from('rooms')
        .update({
          status: 'playing',
          round: room.round + 1,
        })
        .eq('id', room.id)

      onNextRound()
    } catch (error) {
      console.error('Erro ao iniciar próxima rodada:', error)
    }
  }

  const endGame = async () => {
    try {
      await supabase
        .from('rooms')
        .update({ status: 'ended' })
        .eq('id', room.id)

      onEndGame()
    } catch (error) {
      console.error('Erro ao finalizar jogo:', error)
    }
  }

  const canSubmit = myChoice && !hasVoted

  // Verificar se um jogador está selecionado
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
        {/* Se está revelando resultado */}
        {revealResult && (
          <div className="space-y-4">
            {/* Quem foi o mais votado */}
            {mostVotedPlayer?.player ? (
              <div className={`rounded-xl p-6 text-center border-2 ${mostVotedPlayer.wasImpostor
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/30 border-green-500/50'
                : 'bg-gradient-to-br from-orange-500/20 to-amber-600/30 border-orange-500/50'
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
              <div className="bg-muted/50 rounded-xl p-6 text-center border-2 border-muted">
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

        {/* Votação única */}
        {!revealResult && (
          <>
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">
                {t('voting.choose_option')}
              </p>

              {/* Seção: Votar em jogador como impostor */}
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

              {/* Divisor */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-black dark:border-white" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-black px-2 text-muted-foreground border-2 border-black dark:border-white shadow-[2px_2px_0_0]">{t('common.or')}</span>
                </div>
              </div>

              {/* Seção: Ações alternativas */}
              {/* Seção: Ações alternativas */}
              <SelectionGroup>
                <SelectionItem
                  checked={myChoice?.type === 'next_round'}
                  onChange={() => !hasVoted && setMyChoice({ type: 'next_round' })}
                  disabled={hasVoted}
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

            {/* Botão de confirmar */}
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
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                  <Check className="size-4" />
                  {t('voting.confirmed')}
                </p>
              </div>
            )}

            {/* Status de votação */}
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
