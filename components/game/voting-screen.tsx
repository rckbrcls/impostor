'use client'

import { useState, useEffect } from 'react'
import { supabase, type Player, type Room, type Vote } from '@/lib/supabase'
import { getRandomWord } from '@/lib/words'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, User, Play, Flag, Loader2 } from 'lucide-react'

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

  const impostor = players.find((p) => p.is_impostor)
  const totalPlayers = players.length
  const isCurrentPlayerImpostor = currentPlayer?.is_impostor ?? false

  // Jogadores que podem receber votos (todos podem votar em qualquer um - debug mode)
  const votablePlayers = players

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

  // Processar resultados quando todos votarem (apenas o host processa para evitar race conditions)
  useEffect(() => {
    console.log('[Voting] Check process:', { votesCount: votes.length, totalPlayers, isProcessing, revealResult, isHost })
    if (votes.length === totalPlayers && votes.length > 0 && !isProcessing && !revealResult && isHost) {
      console.log('[Voting] All voted, host processing results...')
      processVotingResults()
    }
  }, [votes, totalPlayers, isProcessing, revealResult, isHost])

  // Contar votos para cada jogador (impostor)
  const getImpostorVoteCount = (playerId: string) => {
    return votes.filter((v) => v.impostor_vote === playerId).length
  }

  // Contar votos de ação
  const getActionVoteCount = (action: 'next_round' | 'end_game') => {
    return votes.filter((v) => v.action_vote === action && !v.impostor_vote).length
  }

  // Jogadores que ainda não votaram
  const pendingVoters = players.filter(
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

    // Aguardar um momento para mostrar resultado
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Determinar ação baseada na maioria
    // Prioridade: votos em jogadores > próxima rodada > finalizar
    let action: 'next_round' | 'end_game'

    if (maxVotes >= nextRoundVotes && maxVotes >= endGameVotes) {
      // Maioria votou em jogadores - dar pontos e ir para próxima rodada
      action = 'next_round'
    } else if (nextRoundVotes > endGameVotes) {
      action = 'next_round'
    } else if (endGameVotes > nextRoundVotes) {
      action = 'end_game'
    } else {
      // Empate total: próxima rodada tem prioridade
      action = 'next_round'
    }

    // Dar ponto a quem acertou o impostor (só se votaram em jogador)
    const realImpostorId = impostor?.id
    if (realImpostorId) {
      const correctVoters = votes
        .filter((v) => v.impostor_vote === realImpostorId)
        .map((v) => v.voter_id)

      for (const voterId of correctVoters) {
        const player = players.find((p) => p.id === voterId)
        if (player) {
          await supabase
            .from('players')
            .update({ score: player.score + 1 })
            .eq('id', voterId)
        }
      }
    }

    // Executar ação
    if (action === 'next_round') {
      await startNextRound()
    } else {
      await endGame()
    }
  }

  const startNextRound = async () => {
    try {
      // Sortear novo impostor
      const impostorIndex = Math.floor(Math.random() * players.length)
      const impostorId = players[impostorIndex].id

      // Resetar todos para não-impostor
      await supabase
        .from('players')
        .update({ is_impostor: false })
        .eq('room_id', room.id)

      // Marcar o novo impostor
      await supabase
        .from('players')
        .update({ is_impostor: true })
        .eq('id', impostorId)

      // Atualizar sala com nova rodada e palavra
      await supabase
        .from('rooms')
        .update({
          status: 'playing',
          round: room.round + 1,
          word: getRandomWord(),
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
        <CardTitle className="text-2xl">Rodada {room.round} - Votação</CardTitle>
        <CardDescription>
          {revealResult ? (
            <>A palavra era: <strong className="text-foreground">{room.word}</strong></>
          ) : (
            'Quem você acha que é o impostor?'
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
                : 'bg-gradient-to-br from-red-500/20 to-rose-600/30 border-red-500/50'
                }`}>
                <p className="text-sm text-muted-foreground mb-2">O mais votado foi:</p>
                <p className="text-3xl font-bold mb-2">
                  {mostVotedPlayer.player.name}
                </p>
                {mostVotedPlayer.wasImpostor ? (
                  <p className="text-xl text-green-400 font-semibold">✅ ERA O IMPOSTOR!</p>
                ) : (
                  <p className="text-xl text-red-400 font-semibold">❌ NÃO ERA O IMPOSTOR</p>
                )}
              </div>
            ) : (
              <div className="bg-muted/50 rounded-xl p-6 text-center border-2 border-muted">
                <p className="text-muted-foreground">Ninguém foi votado como impostor</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Processando votos...</span>
            </div>
          </div>
        )}

        {/* Votação única */}
        {!revealResult && (
          <>
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">
                Escolha UMA opção:
              </p>

              {/* Seção: Votar em jogador como impostor */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  🕵️ Votar em quem você acha que é o impostor:
                </p>
                <div className="grid gap-2">
                  {votablePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => !hasVoted && setMyChoice({ type: 'player', playerId: player.id })}
                      disabled={hasVoted}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${isPlayerSelected(player.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-muted bg-muted/50 hover:border-muted-foreground/30'
                        } ${hasVoted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      <span className="flex items-center gap-2">
                        <User className="size-4" />
                        {player.name}
                        {player.id === currentPlayer?.id && (
                          <span className="text-xs text-muted-foreground">(você)</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        {isPlayerSelected(player.id) && (
                          <Check className="size-4 text-primary" />
                        )}
                        {votes.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {getImpostorVoteCount(player.id)} voto{getImpostorVoteCount(player.id) !== 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divisor */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Seção: Ações alternativas */}
              <div className="grid gap-2">
                <button
                  onClick={() => !hasVoted && setMyChoice({ type: 'next_round' })}
                  disabled={hasVoted}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${myChoice?.type === 'next_round'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-muted bg-muted/50 hover:border-muted-foreground/30'
                    } ${hasVoted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span className="flex items-center gap-2">
                    <Play className="size-4" />
                    Próxima rodada (pular votação)
                  </span>
                  <span className="flex items-center gap-2">
                    {myChoice?.type === 'next_round' && (
                      <Check className="size-4 text-green-500" />
                    )}
                    {votes.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {getActionVoteCount('next_round')} voto{getActionVoteCount('next_round') !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  onClick={() => !hasVoted && setMyChoice({ type: 'end_game' })}
                  disabled={hasVoted}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${myChoice?.type === 'end_game'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-muted bg-muted/50 hover:border-muted-foreground/30'
                    } ${hasVoted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span className="flex items-center gap-2">
                    <Flag className="size-4" />
                    Finalizar jogo
                  </span>
                  <span className="flex items-center gap-2">
                    {myChoice?.type === 'end_game' && (
                      <Check className="size-4 text-red-500" />
                    )}
                    {votes.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {getActionVoteCount('end_game')} voto{getActionVoteCount('end_game') !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>
                </button>
              </div>
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
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 size-4" />
                    Confirmar Voto
                  </>
                )}
              </Button>
            )}

            {hasVoted && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                  <Check className="size-4" />
                  Voto registrado!
                </p>
              </div>
            )}

            {/* Status de votação */}
            <div className="text-center text-sm text-muted-foreground">
              {pendingVoters.length > 0 ? (
                <>
                  <p className="mb-1">
                    Aguardando: {pendingVoters.map((p) => p.name).join(', ')}
                  </p>
                  <p>
                    ({votes.length}/{totalPlayers} votos)
                  </p>
                </>
              ) : (
                <p>Todos votaram! Processando resultados...</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
